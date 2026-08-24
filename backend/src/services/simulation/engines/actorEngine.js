import MarketActor from "../../../models/MarketActor.js";
import Contract from "../../../models/Contract.js";
import { generateActor } from "../../actor/actorGenerator.js";
import { addNotification } from "../helpers/notificationHelper.js";
import {
  CAREER_STAGES,
  CAREER_STAGE_LABELS,
  STARDOM_TIER_LABELS,
  getActorCareerStage,
  calculateActorStardom,
  calculateActorDemand,
  calculateDynamicSalary,
  evolveActorStats,
  shouldActorRetire,
} from "../../actor/actorLifecycleEngine.js";

const WEEKS_PER_YEAR = 52;

/**
 * Archives a retiring actor safely into gameState.retiredActors while preserving
 * legacy status, career stats, and notifying the studio.
 */
export const archiveRetiredActor = (gameState, actorData) => {
  gameState.retiredActors = gameState.retiredActors || [];
  const alreadyPreserved = gameState.retiredActors.some(
    (retired) => retired.id === actorData.id
  );

  if (!alreadyPreserved) {
    const careerStage = getActorCareerStage(actorData);
    const isLegacy = careerStage === CAREER_STAGES.LEGACY;
    const { stardomTier } = calculateActorStardom(actorData);

    gameState.retiredActors.push({
      ...actorData,
      status: "RETIRED",
      careerStage,
      isLegacy,
      stardomTier,
      retiredAtWeek: gameState.currentWeek,
    });

    if (isLegacy) {
      addNotification(
        gameState,
        `Legendary actor ${actorData.name} has concluded their iconic career and entered the Hall of Legends!`
      );
    } else {
      addNotification(
        gameState,
        `${actorData.name} (${CAREER_STAGE_LABELS[careerStage] || "Actor"}) has retired from acting.`
      );
    }
  }
};

/**
 * Evaluates aging, skill evolution, stardom transitions, and retirement for market actors.
 */
export const ageMarketActorPool = ({ actors = [], gameState, activeContractActorIds = new Set() }) => {
  const activeActors = [];
  let retiredCount = 0;

  actors.forEach((actor) => {
    if (actor.status === "RETIRED") {
      archiveRetiredActor(gameState, actor);
      return;
    }

    actor.age = Number(actor.age || 0) + 1;
    evolveActorStats(actor);

    // Dynamic market salary calibration based on evolving demand & stardom
    actor.salary = calculateDynamicSalary(actor);

    // Evaluate retirement: defer if active contract exists
    const wantsRetire = shouldActorRetire(actor);
    const hasContract = activeContractActorIds.has(actor.id);

    if (wantsRetire && !hasContract) {
      archiveRetiredActor(gameState, actor);
      retiredCount += 1;
      return;
    }

    activeActors.push(actor);
  });

  return { activeActors, retiredCount };
};

/**
 * Evaluates aging, skill evolution, stardom transitions, and retirement for owned studio actors.
 */
export const ageOwnedActorPool = ({
  actors = [],
  gameState,
  activeMovieActorIds = new Set(),
  activeContractActorIds = new Set(),
}) => {
  const activeActors = [];
  let retiredCount = 0;

  actors.forEach((actor) => {
    if (actor.status === "RETIRED") {
      archiveRetiredActor(gameState, actor);
      return;
    }

    const previousStardom = calculateActorStardom(actor).stardomTier;

    actor.age = Number(actor.age || 0) + 1;
    evolveActorStats(actor);

    const newStardom = calculateActorStardom(actor);
    if (previousStardom !== newStardom.stardomTier) {
      addNotification(
        gameState,
        `${actor.name} has risen to become a ${STARDOM_TIER_LABELS[newStardom.stardomTier]}!`
      );
    }

    // Dynamic salary evolution
    actor.salary = calculateDynamicSalary(actor);

    const wantsRetire = shouldActorRetire(actor);
    const isCast = activeMovieActorIds.has(actor.id);
    const hasContract = activeContractActorIds.has(actor.id);

    if (wantsRetire) {
      // Defer retirement if cast in active production or under active contract (#270, #521)
      if (isCast || hasContract) {
        activeActors.push(actor);
        return;
      }
      archiveRetiredActor(gameState, actor);
      retiredCount += 1;
      return;
    }

    activeActors.push(actor);
  });

  return { activeActors, retiredCount };
};

/**
 * Main weekly actor aging and lifecycle orchestrator. Runs yearly on week intervals.
 */
export const processActorAging = async (gameState) => {
  if (gameState.currentWeek % WEEKS_PER_YEAR !== 0) {
    return;
  }

  const userId = gameState.user;

  // Gather active talent contract actor IDs to safeguard against premature retirement
  const activeContracts = await Contract.find({
    userId,
    status: { $in: ["ACCEPTED", "RENEGOTIATED"] },
  }).lean();
  const activeContractActorIds = new Set(activeContracts.map((c) => c.talentId));

  // 1. Age Market Actors
  const marketActors = await MarketActor.find({ userId }).lean();
  const marketResult = ageMarketActorPool({
    actors: marketActors,
    gameState,
    activeContractActorIds,
  });

  const retiredIds = marketActors
    .filter((a) => !marketResult.activeActors.some((aa) => aa.id === a.id))
    .map((a) => a._id);

  if (retiredIds.length > 0) {
    await MarketActor.deleteMany({ _id: { $in: retiredIds } });
  }

  // Update surviving market actors via bulkWrite
  if (marketResult.activeActors.length > 0) {
    const bulkOps = marketResult.activeActors.map((actor) => ({
      updateOne: {
        filter: { _id: actor._id },
        update: { $set: { age: actor.age } },
      },
    }));
    await MarketActor.bulkWrite(bulkOps);
  }

  // 2. Age Owned Actors
  const activeMovieActorIds = new Set();
  (gameState.activeMovies || []).forEach((movie) => {
    if (!["RELEASED", "RELEASED_STREAMING"].includes(movie.status)) {
      if (movie.leadActorId) activeMovieActorIds.add(movie.leadActorId);
      if (movie.supportingActorIds) {
        movie.supportingActorIds.forEach((id) => activeMovieActorIds.add(id));
      }
    }
  });

  const ownedResult = ageOwnedActorPool({
    actors: gameState.ownedActors || [],
    gameState,
    activeMovieActorIds,
    activeContractActorIds,
  });

  gameState.ownedActors = ownedResult.activeActors;

  // 3. Replenish market with fresh talent for retired performers
  const totalRetirements = marketResult.retiredCount + ownedResult.retiredCount;
  if (totalRetirements > 0) {
    const replacements = [];
    for (let index = 0; index < totalRetirements; index += 1) {
      replacements.push({
        ...generateActor(),
        userId,
      });
    }
    await MarketActor.insertMany(replacements);
  }
};
