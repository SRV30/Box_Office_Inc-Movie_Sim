import Movie from "../../../models/Movie.js";
import { addNotification } from "../helpers/notificationHelper.js";
import { generateStreamingOffers } from "./streamingEngine.js";

/**
 * @fileoverview Production Engine
 *
 * Manages the progression of active movies through three sequential
 * production stages: PRE_PRODUCTION → PRODUCTION → POST_PRODUCTION →
 * READY_FOR_RELEASE.
 *
 * Each week (tick), every active movie advances by one week within its
 * current stage. Talent reliability can cause delays (stall progress) or
 * accelerate production (bonus progress week). When a stage completes, the
 * movie transitions to the next stage and any attached talent is freed upon
 * reaching READY_FOR_RELEASE.
 *
 * ## Stage Durations
 * | Stage           | Weeks |
 * |-----------------|-------|
 * | PRE_PRODUCTION  |   4   |
 * | PRODUCTION      |  10   |
 * | POST_PRODUCTION |   6   |
 * | **Total**       | **20**|
 *
 * Movies are persisted (`movie.save()`) after every update.
 */

/**
 * Stage configuration map.
 * Each entry defines the week duration and the next stage name.
 *
 * @type {Object.<string, {duration: number, next: string}>}
 */
const STAGES = {
  PRE_PRODUCTION: { duration: 4, next: "PRODUCTION" },
  PRODUCTION: { duration: 10, next: "POST_PRODUCTION" },
  POST_PRODUCTION: { duration: 6, next: "READY_FOR_RELEASE" },
};

/**
 * Advances all active movies through their production stages for one week.
 *
 * ## Reliability System
 * Average reliability is computed across the attached director, lead actor,
 * and crew team. Missing talent defaults to 50 (neutral).
 *
 * | Condition                         | Effect                         |
 * |-----------------------------------|--------------------------------|
 * | avgReliability < 40 AND roll < 20 | Delay: no progress this week   |
 * | avgReliability > 80 AND roll > 80 | Bonus: +2 weeks progress       |
 * | Otherwise                         | Normal: +1 week progress       |
 *
 * ## Progress Calculation
 * `productionProgress` is a 0–100 percentage of the full 20-week pipeline.
 * `remainingWeeks` counts weeks left until READY_FOR_RELEASE.
 *
 * When a movie reaches READY_FOR_RELEASE:
 * - `productionProgress` is set to 100.
 * - `releaseWeek` is set to `currentWeek + 1` (suggested release window).
 * - All attached talent is freed (status → "AVAILABLE", busyUntilWeek → null).
 *
 * @async
 * @param {object} gameState                    - GameState document (mutated in place).
 * @param {number} gameState.currentWeek        - The current simulation week number.
 * @param {Array}  gameState.activeMovies       - Array of active Movie ObjectIds.
 * @param {Array}  [gameState.ownedDirectors=[]] - Director talent objects with `reliability`.
 * @param {Array}  [gameState.ownedActors=[]]   - Actor talent objects with `reliability`.
 * @param {Array}  [gameState.ownedCrewTeams=[]] - Crew team objects with `reliability`.
 * @param {object} studio                       - Studio document (passed through to notifications).
 * @returns {Promise<void>}
 */
export const processProduction = async (gameState, studio) => {
  if (!gameState.activeMovies || gameState.activeMovies.length === 0) return;

  // Lock production if crew union is striking (issue #285)
  if (gameState.crewUnion && gameState.crewUnion.isStriking) {
    addNotification(gameState, "Production is halted: film crew union is currently striking!");
    return;
  }

  const movies = await Movie.find({
    _id: { $in: gameState.activeMovies },
    status: { $in: Object.keys(STAGES) },
  });

  for (const movie of movies) {
    const stageInfo = STAGES[movie.status];
    if (!stageInfo) continue;

    // --- Production event delays ---
    // If a production event (e.g. actor injury, script rewrite) has imposed
    // delay weeks, decrement the counter and skip normal progress this tick.
    if ((movie.delayWeeks || 0) > 0) {
      movie.delayWeeks -= 1;
      addNotification(gameState, `Production on "${movie.title}" is delayed (${movie.delayWeeks} week(s) remaining).`);
      if (gameState.crewUnion) {
        gameState.crewUnion.satisfaction = Math.max(0, (gameState.crewUnion.satisfaction || 100) - 10);
      }
      gameState.productionDelayHappened = true;
      await movie.save();
      continue;
    }

    // Get talent for reliability effects
    const director = gameState.ownedDirectors.find(d => d.id === movie.directorId);
    const leadActor = gameState.ownedActors.find(a => a.id === movie.leadActorId);
    const crewTeam = gameState.ownedCrewTeams.find(c => c.id === movie.crewTeamId);

    // Calculate reliability factor (average 0-100, mapped to influence)
    const avgReliability = (
      (director?.reliability || 50) +
      (leadActor?.reliability || 50) +
      (crewTeam?.reliability || 50)
    ) / 3;

    // Reliability effect: High reliability (80+) gives a chance for bonus progress
    // Low reliability (<40) gives a chance for a delay (no progress this week)
    let weeklyProgress = 1;
    let delay = false;

    const roll = Math.random() * 100;
    if (avgReliability < 40 && roll < 20) {
      delay = true;
      weeklyProgress = 0;
      addNotification(gameState, `Production on "${movie.title}" faced a delay due to reliability issues.`);
      if (gameState.crewUnion) {
        gameState.crewUnion.satisfaction = Math.max(0, (gameState.crewUnion.satisfaction || 100) - 15);
      }
      gameState.productionDelayHappened = true;
    } else if (avgReliability > 80 && roll > 80) {
      weeklyProgress = 2;
      addNotification(gameState, `Production on "${movie.title}" is ahead of schedule!`);
    }

    movie.weeksInStage += weeklyProgress;

    // Calculate total progress percentage
    // Typical total duration = 4 + 10 + 6 = 20
    const totalTarget = STAGES.PRE_PRODUCTION.duration + STAGES.PRODUCTION.duration + STAGES.POST_PRODUCTION.duration;
    let currentCompleted = 0;
    if (movie.status === "PRODUCTION") currentCompleted = STAGES.PRE_PRODUCTION.duration;
    if (movie.status === "POST_PRODUCTION") currentCompleted = STAGES.PRE_PRODUCTION.duration + STAGES.PRODUCTION.duration;

    movie.productionProgress = Math.min(100, Math.round(((currentCompleted + movie.weeksInStage) / totalTarget) * 100));

    // Calculate remaining weeks
    const currentAbsoluteWeeks = currentCompleted + movie.weeksInStage;
    movie.remainingWeeks = Math.max(0, totalTarget - currentAbsoluteWeeks);

    if (movie.weeksInStage >= stageInfo.duration) {
      const oldStatus = movie.status;
      movie.status = stageInfo.next;
      movie.weeksInStage = 0;

      addNotification(gameState, `"${movie.title}" has moved from ${oldStatus} to ${movie.status}.`);

      if (movie.status === "READY_FOR_RELEASE") {
        movie.productionProgress = 100;
        movie.releaseWeek = gameState.currentWeek + 1; // Suggest release next week

        // Generate streaming offers
        await generateStreamingOffers(movie, gameState);

        // Release talent if ready for release (or keep them busy until release?)
        // Instructions say: "When movie finishes: status = AVAILABLE"
        // Let's treat READY_FOR_RELEASE as finished for the talent.
        releaseTalent(gameState, movie);
      }
    }

    await movie.save();
  }
};

/**
 * Frees all talent attached to a movie once it reaches READY_FOR_RELEASE.
 * Sets each talent's `status` to "AVAILABLE" and clears `busyUntilWeek`.
 *
 * @param {object} gameState - GameState document with owned talent arrays.
 * @param {object} movie     - The movie that has just finished production.
 * @param {string} [movie.directorId]  - ID of the attached director.
 * @param {string} [movie.leadActorId] - ID of the attached lead actor.
 * @param {string} [movie.crewTeamId]  - ID of the attached crew team.
 * @returns {void}
 */
const releaseTalent = (gameState, movie) => {
  const director = gameState.ownedDirectors.find(d => d.id === movie.directorId);
  const leadActor = gameState.ownedActors.find(a => a.id === movie.leadActorId);
  const crewTeam = gameState.ownedCrewTeams.find(c => c.id === movie.crewTeamId);

  if (director) {
    director.status = "AVAILABLE";
    director.busyUntilWeek = null;
  }
  if (leadActor) {
    leadActor.status = "AVAILABLE";
    leadActor.busyUntilWeek = null;
  }
  if (crewTeam) {
    crewTeam.status = "AVAILABLE";
    crewTeam.busyUntilWeek = null;
  }
  if (movie.supportingActorIds && movie.supportingActorIds.length > 0) {
    movie.supportingActorIds.forEach(actorId => {
      const sActor = gameState.ownedActors.find(a => a.id === actorId);
      if (sActor) {
        sActor.status = "AVAILABLE";
        sActor.busyUntilWeek = null;
      }
    });
  }
};
