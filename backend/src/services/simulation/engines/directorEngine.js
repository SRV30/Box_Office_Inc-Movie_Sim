import MarketDirector from "../../../models/MarketDirector.js";
import {
  createReplacementDirector,
} from "../../director/directorRetirementService.js";

/**
 * @fileoverview Director Aging Engine
 *
 * Handles annual aging and retirement of directors in both the owned roster and
 * the public market pool. Runs once per simulated year (every 52 weeks) to keep
 * the director economy realistic.
 *
 * ## Lifecycle (Market Directors — stored in separate MarketDirector collection)
 * 1. Fetch all market directors for this game from the MarketDirector collection.
 * 2. Age increments by +1 for every non-retired director.
 * 3. Directors reaching `RETIREMENT_AGE` (90) are retired:
 *    - Removed from the MarketDirector collection.
 *    - Archived into `gameState.retiredDirectors`.
 * 4. For every director that retires, one fresh replacement director is generated
 *    and inserted into the MarketDirector collection — keeping total market supply stable.
 *
 * ## Lifecycle (Owned Directors — still embedded in GameState)
 * 1. Same aging/retirement logic applied to `gameState.ownedDirectors`.
 * 2. Retired owned directors have their active projects flagged for replacement.
 * 3. Retired owned directors are moved to `gameState.retiredDirectors`.
 * 4. A replacement is added to the market pool (MarketDirector collection).
 */

/** Retirement age threshold. Directors at or above this age are retired. */
const RETIREMENT_AGE = 90;

/** Number of simulation weeks in one in-game year; aging runs on this cadence. */
const WEEKS_PER_YEAR = 52;

/**
 * Flags all active directing projects owned by a retiring director as needing
 * a replacement, so the game doesn't leave orphaned projects.
 *
 * @param {object} gameState            - GameState document.
 * @param {Array}  [gameState.activeDirectorProjects=[]] - Active directing projects.
 * @param {object} director             - The director about to be retired.
 * @param {string} director.id          - Director's unique ID.
 * @returns {void}
 */
const markRetiredDirectorProjectsForReplacement = (gameState, director) => {
  (gameState.activeDirectorProjects || []).forEach((project) => {
    if (project.directorId !== director.id) {
      return;
    }

    project.replacementRequired = true;
    project.status = "NEEDS_DIRECTOR_REPLACEMENT";
  });
};

/**
 * Archives a retiring director into `gameState.retiredDirectors`.
 *
 * @param {object} gameState
 * @param {object} directorData - Plain object representation of the director.
 * @returns {void}
 */
const archiveRetiredDirector = (gameState, directorData) => {
  gameState.retiredDirectors = gameState.retiredDirectors || [];

  const alreadyPreserved = gameState.retiredDirectors.some(
    (retired) => retired.id === directorData.id
  );

  if (!alreadyPreserved) {
    gameState.retiredDirectors.push({
      ...directorData,
      status: "RETIRED",
      retiredAtWeek: gameState.currentWeek,
    });
  }
};

/**
 * Processes a pool of market directors (from MarketDirector collection):
 * ages them, retires those at the cap, and returns retirement count.
 *
 * @param {object}   params
 * @param {Array}    params.directors - Array of MarketDirector documents.
 * @param {object}   params.gameState - GameState document for archiving.
 * @returns {{ activeDirectors: Array, retiredCount: number }}
 */
const ageMarketDirectorPool = ({ directors = [], gameState }) => {
  const activeDirectors = [];
  const retiredDirectors = [];
  let retiredCount = 0;

  directors.forEach((director) => {
    if (director.status === "RETIRED") {
      archiveRetiredDirector(gameState, director);
      retiredDirectors.push(director);
      return;
    }

    director.age = Number(director.age || 0) + 1;

    if (director.age >= RETIREMENT_AGE) {
      archiveRetiredDirector(gameState, director);
      retiredCount += 1;
      retiredDirectors.push(director);
      return;
    }

    activeDirectors.push(director);
  });

  return { activeDirectors, retiredDirectors, retiredCount };
};

/**
 * Processes a pool of owned directors (from gameState.ownedDirectors array):
 * ages them, retires those at the cap, flags projects for replacement.
 * Directors currently assigned to active productions are skipped from
 * retirement to prevent null reference crashes mid-production (#270).
 *
 * @param {object}   params
 * @param {Array}    params.directors - Array of owned director objects.
 * @param {object}   params.gameState - GameState document.
 * @param {Set}      params.activeProductionDirectorIds - Set of director IDs in active movies.
 * @returns {{ activeDirectors: Array, retiredCount: number }}
 */
const ageOwnedDirectorPool = ({ directors = [], gameState, activeProductionDirectorIds = new Set() }) => {
  const activeDirectors = [];
  let retiredCount = 0;

  directors.forEach((director) => {
    if (director.status === "RETIRED") {
      archiveRetiredDirector(gameState, director);
      return;
    }

    director.age = Number(director.age || 0) + 1;

    if (director.age >= RETIREMENT_AGE) {
      // Do not retire a director who is currently assigned to an active production.
      // Their retirement is deferred until the production completes.
      if (activeProductionDirectorIds.has(director.id)) {
        activeDirectors.push(director);
        return;
      }
      markRetiredDirectorProjectsForReplacement(gameState, director);
      archiveRetiredDirector(gameState, director);
      retiredCount += 1;
      return;
    }

    activeDirectors.push(director);
  });

  return { activeDirectors, retiredCount };
};

/**
 * Entry point called by the weekly tick engine. Ages all directors in both
 * the market and owned pools, retires eligible ones, and replenishes the
 * market with an equal number of freshly-generated replacements.
 *
 * Market directors are stored in the `MarketDirector` collection (separate from
 * GameState to avoid unbounded document growth — issue #188).
 * Owned directors remain in `gameState.ownedDirectors` (bounded by player hires).
 *
 * This function is a no-op for every week that is not a year boundary
 * (`currentWeek % 52 !== 0`), keeping it cheap to call every tick.
 *
 * @async
 * @param {object} gameState                   - GameState document (mutated in place).
 * @param {number} gameState.currentWeek       - Current simulation week.
 * @param {string} gameState.user              - User ID to scope MarketDirector queries.
 * @returns {Promise<void>}
 */
export const processDirectorAging = async (gameState) => {
  if (gameState.currentWeek % WEEKS_PER_YEAR !== 0) {
    return;
  }

  const userId = gameState.user;

  // -----------------------------------------------------------------------
  // 1. Market directors (MarketDirector collection)
  // -----------------------------------------------------------------------
  const marketDirectors = await MarketDirector.find({ userId }).lean();

  const marketResult = ageMarketDirectorPool({
    directors: marketDirectors,
    gameState,
  });

  // Bulk-write updates: delete retired directors, update surviving ones
  const retiredIds = marketResult.retiredDirectors.map((d) => d._id);

  if (retiredIds.length > 0) {
    await MarketDirector.deleteMany({ _id: { $in: retiredIds } });
  }

  // Update surviving active directors via bulkWrite
  if (marketResult.activeDirectors.length > 0) {
    const bulkOps = marketResult.activeDirectors.map((director) => ({
      updateOne: {
        filter: { _id: director._id },
        update: { $set: { age: director.age } },
      },
    }));
    await MarketDirector.bulkWrite(bulkOps);
  }

  // -----------------------------------------------------------------------
  // 2. Owned directors (gameState.ownedDirectors)
  // -----------------------------------------------------------------------

  // Collect director IDs who are currently assigned to active (non-released) movies
  // so we can defer their retirement and prevent null-reference crashes (#270).
  const activeProductionDirectorIds = new Set(
    (gameState.activeMovies || [])
      .filter((m) => !["RELEASED", "RELEASED_STREAMING"].includes(m.status))
      .map((m) => m.directorId)
      .filter(Boolean)
  );

  const ownedResult = ageOwnedDirectorPool({
    directors: gameState.ownedDirectors || [],
    gameState,
    activeProductionDirectorIds,
  });

  gameState.ownedDirectors = ownedResult.activeDirectors;

  // -----------------------------------------------------------------------
  // 3. Replenish market with replacements
  // -----------------------------------------------------------------------
  const totalRetirements = marketResult.retiredCount + ownedResult.retiredCount;

  if (totalRetirements > 0) {
    const replacements = [];
    for (let index = 0; index < totalRetirements; index += 1) {
      replacements.push({
        ...createReplacementDirector(),
        userId,
      });
    }
    await MarketDirector.insertMany(replacements);
  }
};
