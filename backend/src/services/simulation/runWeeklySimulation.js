import { processWeeklyTick } from "./engines/tickEngine.js";

export const runWeeklySimulation = async (gameState) => {
  await processWeeklyTick(gameState);
};
