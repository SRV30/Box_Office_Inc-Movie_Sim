import { processDirectorAwards } from "../../director/directorAwardsService.js";
import { processActorAwards } from "../../actor/actorAwardsService.js";
import { processCrewProgression } from "../../crew/crewProgressionService.js";
import { processDirectorAging } from "./directorEngine.js";
import { processActorAging } from "./actorEngine.js";
import { processDirectingProjects } from "./directingProjectEngine.js";
import { processProduction } from "./productionEngine.js";
import { processWriterPayroll } from "./payrollEngine.js";
import { processWritingProjects } from "./writerEngine.js";
import { processMarketTrends } from "./trendEngine.js";
import { generateRivalStudios, processRivalStudios } from "./rivalStudioEngine.js";
import { processProductionEvents } from "./eventEngine.js";
import { processRandomEvents } from "./eventEngine.js";
import { processMerchandiseSales } from "./merchandiseEngine.js";
import { processAnnualAwards } from "./awardsEngine.js";
import { generateNewsFromTrend, generateNewsFromEvent } from "./newsEngine.js";
import { processStreamingPlatformGrowth, processStreamingRevenue } from "./streamingEngine.js";
import { processLoanRepayments } from "./loanRepaymentEngine.js";
import { processFanClubTick } from "./fanClubEngine.js";
import { processUnionSatisfaction } from "./unionEngine.js";
import { processScandals } from "./prEngine.js";
import { processScheduledReleases } from "./clashEngine.js";
import { processWeeklyRelationships } from "./relationshipEngine.js";
import { processWeeklySocialMedia } from "./socialMediaEngine.js";

import { addNotification } from "../helpers/notificationHelper.js";
import { processWriterAging } from "../helpers/agingHelper.js";
import TalentHistory from "../../../models/TalentHistory.js";
import MarketDirector from "../../../models/MarketDirector.js";
import MarketActor from "../../../models/MarketActor.js";

/**
 * @fileoverview Tick Engine — Weekly Simulation Orchestrator
 *
 * This is the central coordinator for a single simulation week. It calls every
 * sub-engine in a specific, intentional order so that each phase can observe
 * the side-effects of the previous phase.
 *
 * ## Execution Order (per weekly tick)
 * 1. **Market Trends** — advance the genre trend climate; any trend notifications
 *    are queued before other events so they appear at the top of the feed.
 * 2. **Writer Payroll** — deduct all talent salaries from studio funds while
 *    the market state is already up-to-date.
 * 3. **Writing Projects** — advance writer projects; may complete scripts and
 *    free writers back to the market.
 * 4. **Directing Projects** — advance director projects; may complete pre-production
 *    packages and free directors.
 * 5. **Production** — advance movies through PRE_PRODUCTION → PRODUCTION →
 *    POST_PRODUCTION → READY_FOR_RELEASE.
 * 6. **Writer Aging** — age all writers by one week-unit (runs yearly).
 * 7. **Director Aging** — age all directors; retire those past the age cap.
 * 8. **Director Awards** — evaluate award eligibility for owned directors.
 * 9. **Random Events** — roll for industry events last so they react to the
 *    week's financial activity and can adjust studio stats before persistence.
 *
 * @module tickEngine
 */

/**
 * Runs one full week of the simulation for a studio.
 *
 * Mutates `gameState` and `studio` in place across all sub-engines. The caller
 * (`runWeeklySimulation`) is responsible for persisting both documents after
 * this function resolves.
 *
 * Market talent (directors, actors) is now stored in separate collections to
 * avoid unbounded GameState document growth (issue #188). Award processing
 * temporarily attaches market directors/actors to the gameState object for
 * backward compatibility with the awards services.
 *
 * @async
 * @param {object} gameState    - GameState mongoose document for the current studio.
 * @param {number} gameState.currentWeek - The week that is currently being processed.
 * @param {object} studio       - Studio mongoose document for the current studio.
 * @returns {Promise<object>}   The mutated `gameState` after all engines have run.
 */
export const processWeeklyTick = async (gameState, studio) => {
  // Initialize rival studios on the very first tick (once per game)
  generateRivalStudios(gameState);

  // Advance the market climate first so any releases this tick reflect the
  // current week's active trends.
  const trendMessages = processMarketTrends(gameState);
  trendMessages.forEach((msg) => addNotification(gameState, msg));

  // Generate news items for newly spawned trends
  if (gameState.marketTrends && gameState.marketTrends.activeTrends) {
    for (const trend of gameState.marketTrends.activeTrends) {
      if (trend.startWeek === gameState.currentWeek) {
        await generateNewsFromTrend(trend, gameState.currentWeek);
      }
    }
  }

  const payrollPaid = processWriterPayroll(gameState, studio) || 0;

  // Process weekly fan club updates (issue #284)
  processFanClubTick(gameState, studio);

  // Process weekly loan repayments and bankruptcy tracking (issue #195)
  processLoanRepayments(studio, gameState, addNotification);

  await processWritingProjects(gameState, studio);

  processDirectingProjects(gameState, studio);

  await processProduction(gameState, studio);

  // Auto-release movies whose scheduled release week has arrived (issue #348)
  await processScheduledReleases(gameState.currentWeek, gameState, studio);

  // Process crew union satisfaction and strike states (issue #285)
  processUnionSatisfaction(gameState, studio);

  // Tick rival studios — collect their releases for the weekly summary
  const rivalReleases = processRivalStudios(gameState);

  processWriterAging(gameState);

  await processDirectorAging(gameState);

  await processActorAging(gameState);

  const awardYear = Math.floor((Number(gameState.currentWeek || 1) - 1) / 52) + 1;
  const isAwardWeek = gameState.currentWeek % 52 === 0;
  const directorAlreadyProcessed = (gameState.directorAwardYearsProcessed || []).includes(awardYear);
  const actorAlreadyProcessed = (gameState.actorAwardYearsProcessed || []).includes(awardYear);

  if (isAwardWeek && (!directorAlreadyProcessed || !actorAlreadyProcessed)) {
    // Bounded history fetch: only pull CAREER and AWARD entries needed for award processing
    const histories = await TalentHistory.find({
      gameStateId: gameState._id,
      type: { $in: ["CAREER", "AWARD"] },
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    // Fetch market talent from separate collections (issue #188) and attach
    // them temporarily to gameState for award processing.
    const userId = gameState.user;
    const marketDirectors = await MarketDirector.find({ userId }).lean();
    const marketActors = await MarketActor.find({ userId }).lean();

    const attachHistory = (talentList) => {
      if (!talentList) return;
      talentList.forEach((talent) => {
        talent.careerHistory = histories.filter(h => h.talentId === talent.id && h.type === "CAREER").map(h => h.data);
        talent.awardsHistory = histories.filter(h => h.talentId === talent.id && h.type === "AWARD").map(h => h.data);
      });
    };

    // Temporarily attach market data for award services
    gameState._marketDirectors = marketDirectors;
    gameState._marketActors = marketActors;

    attachHistory(gameState._marketDirectors);
    attachHistory(gameState.ownedDirectors);
    attachHistory(gameState.retiredDirectors);
    attachHistory(gameState._marketActors);
    attachHistory(gameState.ownedActors);
    attachHistory(gameState.retiredActors);
  }

  // Patch awards services to read from temporary _market arrays if available,
  // falling back to the (now removed) embedded arrays for safety.
  const origMarketDirectors = gameState.marketDirectors;
  const origMarketActors = gameState.marketActors;
  if (gameState._marketDirectors) gameState.marketDirectors = gameState._marketDirectors;
  if (gameState._marketActors) gameState.marketActors = gameState._marketActors;

  processDirectorAwards(gameState, studio);
  processActorAwards(gameState, studio);
  processCrewProgression(gameState);

  // Restore original state (market arrays no longer on gameState)
  delete gameState.marketDirectors;
  delete gameState.marketActors;
  if (origMarketDirectors !== undefined) gameState.marketDirectors = origMarketDirectors;

  // Persist award mutations back to MarketDirector/MarketActor collections via bulkWrite
  if (gameState._marketDirectors && gameState._marketDirectors.length > 0) {
    const directorBulkOps = gameState._marketDirectors
      .filter((d) => d._id)
      .map((director) => ({
        updateOne: {
          filter: { _id: director._id },
          update: {
            $set: {
              awards: director.awards,
              reputation: director.reputation,
              salary: director.salary,
              marketValue: director.marketValue,
            },
          },
        },
      }));
    if (directorBulkOps.length > 0) {
      await MarketDirector.bulkWrite(directorBulkOps);
    }
  }

  if (gameState._marketActors && gameState._marketActors.length > 0) {
    const actorBulkOps = gameState._marketActors
      .filter((a) => a._id)
      .map((actor) => ({
        updateOne: {
          filter: { _id: actor._id },
          update: {
            $set: {
              awards: actor.awards,
              popularity: actor.popularity,
              salary: actor.salary,
              fanbase: actor.fanbase,
            },
          },
        },
      }));
    if (actorBulkOps.length > 0) {
      await MarketActor.bulkWrite(actorBulkOps);
    }
  }

  delete gameState._marketDirectors;
  delete gameState._marketActors;

  // 9. Production events — movie-level crises & opportunities.
  await processProductionEvents(gameState, studio);

  // 10. Random events — global industry events last so they react to the
  //     week's financial activity.
  const firedEvents = processRandomEvents(gameState, studio);
  if (firedEvents && firedEvents.length > 0) {
    for (const ev of firedEvents) {
      await generateNewsFromEvent(ev.label, ev.message, gameState.currentWeek);
    }
  }

  await processMerchandiseSales(gameState, studio);
  await processStreamingPlatformGrowth(gameState);

  if (gameState.currentWeek > 0 && gameState.currentWeek % 52 === 0) {
    await processAnnualAwards(gameState, studio);
  }

  // Recurring weekly streaming revenue for accepted deals (issue #41) — runs
  // after platform growth so royalties reflect this week's platform popularity.
  await processStreamingRevenue(gameState, studio);

  // 12. PR & Scandal events — roll for studio scandals and apply
  //     reputation decay (issue #281).
  processScandals(gameState, studio);

  // 12b. Social Media Simulation Ecosystem (issue #534)
  if (gameState.user) {
    await processWeeklySocialMedia(gameState, studio);
  }

  // 13. Talent Relationship & Chemistry Lifecycle (issue #535)
  if (gameState.user) {
    await processWeeklyRelationships(gameState.user, gameState.currentWeek);
  }

  const weeklyPayroll = payrollPaid || 0;
  const weeklyMovieCosts = studio._weeklyMovieCosts || 0;
  const weeklyMarketingCosts = studio._weeklyMarketingCosts || 0;
  delete studio._weeklyMovieCosts;
  delete studio._weeklyMarketingCosts;

  return {
    gameState,
    rivalReleases,
    financialSummary: {
      payroll: weeklyPayroll,
      movieCosts: weeklyMovieCosts,
      marketingCosts: weeklyMarketingCosts,
    },
  };
};


export default processWeeklyTick;
