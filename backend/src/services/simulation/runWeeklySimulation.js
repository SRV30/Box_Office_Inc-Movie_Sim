import { processWeeklyTick } from "./engines/tickEngine.js";

export const runWeeklySimulation = async (gameState, studio) => {
  await processWeeklyTick(gameState, studio);
};
