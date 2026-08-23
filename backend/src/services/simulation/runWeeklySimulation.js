import { processWeeklyTick } from "./engines/tickEngine.js";
import rivalStudioService from "../rivalStudioService.js";

/**
 * @fileoverview Weekly Simulation Entry Point
 *
 * This is the outermost layer of the simulation pipeline. Controllers call
 * `runWeeklySimulation` to advance the game by exactly one week. It:
 *  1. Increments `gameState.currentWeek` before any processing begins.
 *  2. Delegates all engine logic to `processWeeklyTick`.
 *
 * The caller is responsible for saving both `gameState` and `studio` to the
 * database after this function resolves.
 */

/**
 * Advances the simulation by one week for the given studio.
 *
 * Increments the week counter on `gameState` and then runs the full tick
 * pipeline (market trends → payroll → writing → directing → production →
 * aging → awards → random events).
 *
 * @async
 * @param {object} gameState          - GameState mongoose document (mutated in place).
 * @param {number} gameState.currentWeek - Current week before the tick; incremented to
 *                                         `currentWeek + 1` before processing begins.
 * @param {object} studio             - Studio mongoose document (mutated in place).
 * @returns {Promise<void>}
 */
export const runWeeklySimulation = async (gameState, studio) => {
  gameState.currentWeek += 1;

  // Run AI Rival Studio updates
  await rivalStudioService.initializeRivalStudios();
  await rivalStudioService.simulateRivalTurn();

  const result = await processWeeklyTick(gameState, studio);

  // processWeeklyTick returns { gameState, rivalReleases, financialSummary }
  return {
    rivalReleases: result.rivalReleases || [],
    financialSummary: result.financialSummary || { payroll: 0, movieCosts: 0, marketingCosts: 0 },
  };
};