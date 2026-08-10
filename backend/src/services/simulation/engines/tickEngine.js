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

import { addNotification } from "../helpers/notificationHelper.js";
import { processWriterAging } from "../helpers/agingHelper.js";
import TalentHistory from "../../../models/TalentHistory.js";
import MarketDirector from "../../../models/MarketDirector.js";
import MarketActor from "../../../models/MarketActor.js";

const buildHistoryMap = (histories) => {
  const map = new Map();
  for (const h of histories) {
    if (!map.has(h.talentId)) {
      map.set(h.talentId, { career: [], awards: [] });
    }
    const entry = map.get(h.talentId);
    if (h.type === "CAREER") {
      entry.career.push(h.data);
    } else if (h.type === "AWARD") {
      entry.awards.push(h.data);
    }
  }
  return map;
};

const attachHistoryFromMap = (talentList, historyMap) => {
  if (!talentList) return;
  for (const talent of talentList) {
    const entry = historyMap.get(talent.id) || { career: [], awards: [] };
    talent.careerHistory = entry.career;
    talent.awardsHistory = entry.awards;
  }
};

export const processWeeklyTick = async (gameState, studio) => {
  generateRivalStudios(gameState);

  const trendMessages = processMarketTrends(gameState);
  trendMessages.forEach((msg) => addNotification(gameState, msg));

  if (gameState.marketTrends && gameState.marketTrends.activeTrends) {
    for (const trend of gameState.marketTrends.activeTrends) {
      if (trend.startWeek === gameState.currentWeek) {
        await generateNewsFromTrend(trend, gameState.currentWeek);
      }
    }
  }

  processWriterPayroll(gameState, studio);
  processFanClubTick(gameState, studio);
  processLoanRepayments(studio, gameState, addNotification);
  await processWritingProjects(gameState, studio);
  processDirectingProjects(gameState, studio);
  await processProduction(gameState, studio);
  await processScheduledReleases(gameState.currentWeek, gameState, studio);
  processUnionSatisfaction(gameState, studio);
  const rivalReleases = processRivalStudios(gameState);
  processWriterAging(gameState);
  await processDirectorAging(gameState);
  await processActorAging(gameState);

  const awardYear = Math.floor((Number(gameState.currentWeek || 1) - 1) / 52) + 1;
  const isAwardWeek = gameState.currentWeek % 52 === 0;
  const directorAlreadyProcessed = (gameState.directorAwardYearsProcessed || []).includes(awardYear);
  const actorAlreadyProcessed = (gameState.actorAwardYearsProcessed || []).includes(awardYear);

  if (isAwardWeek && (!directorAlreadyProcessed || !actorAlreadyProcessed)) {
    const userId = gameState.user;

    const [histories, marketDirectors, marketActors] = await Promise.all([
      TalentHistory.find({ gameStateId: gameState._id }).lean(),
      MarketDirector.find({ userId }).lean(),
      MarketActor.find({ userId }).lean(),
    ]);

    const historyMap = buildHistoryMap(histories);

    gameState._marketDirectors = marketDirectors;
    gameState._marketActors = marketActors;

    attachHistoryFromMap(gameState._marketDirectors, historyMap);
    attachHistoryFromMap(gameState.ownedDirectors, historyMap);
    attachHistoryFromMap(gameState.retiredDirectors, historyMap);
    attachHistoryFromMap(gameState._marketActors, historyMap);
    attachHistoryFromMap(gameState.ownedActors, historyMap);
    attachHistoryFromMap(gameState.retiredActors, historyMap);
  }

  const origMarketDirectors = gameState.marketDirectors;
  const origMarketActors = gameState.marketActors;
  if (gameState._marketDirectors) gameState.marketDirectors = gameState._marketDirectors;
  if (gameState._marketActors) gameState.marketActors = gameState._marketActors;

  processDirectorAwards(gameState, studio);
  processActorAwards(gameState, studio);
  processCrewProgression(gameState);

  delete gameState.marketDirectors;
  delete gameState.marketActors;
  if (origMarketDirectors !== undefined) gameState.marketDirectors = origMarketDirectors;

  if (gameState._marketDirectors) {
    const directorOps = gameState._marketDirectors
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
    if (directorOps.length > 0) {
      await MarketDirector.bulkWrite(directorOps);
    }
  }
  if (gameState._marketActors) {
    const actorOps = gameState._marketActors
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
    if (actorOps.length > 0) {
      await MarketActor.bulkWrite(actorOps);
    }
  }

  delete gameState._marketDirectors;
  delete gameState._marketActors;

  await processProductionEvents(gameState, studio);

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

  await processStreamingRevenue(gameState, studio);
  processScandals(gameState, studio);

  return { gameState, rivalReleases };
};

export default processWeeklyTick;
