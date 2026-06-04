import { processWritingProjects } from "./writerEngine.js";
import { processWeeklySalaries } from "./economyEngine.js";

import { processWriterAging } from "../helpers/agingHelper.js";

export const processWeeklyTick = async (gameState, studio) => {
  gameState.currentWeek += 1;

  // Process Economy
  if (studio) {
    processWeeklySalaries(gameState, studio);
  }

  // Process Writers
  await processWritingProjects(gameState);

  // Process Aging
  processWriterAging(gameState);

  return gameState;
};

export default processWeeklyTick;
