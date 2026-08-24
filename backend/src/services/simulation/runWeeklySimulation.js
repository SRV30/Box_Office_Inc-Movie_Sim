import { processWeeklyTick } from "./engines/tickEngine.js";
import rivalStudioService from "../rivalStudioService.js";

/**
 * @fileoverview Scalable Weekly Simulation Entry Point with Telemetry
 *
 * Advances the simulation by one week with timing instrumentation,
 * bulk-persisted database operations, and bounded memory footprints.
 */

/**
 * Advances the simulation by one week for the given studio with performance profiling.
 *
 * @async
 * @param {object} gameState          - GameState mongoose document (mutated in place).
 * @param {object} studio             - Studio mongoose document (mutated in place).
 * @returns {Promise<{ rivalReleases: Array, financialSummary: object, telemetry: object }>}
 */
export const runWeeklySimulation = async (gameState, studio) => {
  const startHrTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage().heapUsed;

  gameState.currentWeek += 1;

  // Run AI Rival Studio updates
  await rivalStudioService.initializeRivalStudios();
  await rivalStudioService.simulateRivalTurn();

  const result = await processWeeklyTick(gameState, studio);

  const endHrTime = process.hrtime.bigint();
  const endMemory = process.memoryUsage().heapUsed;
  const durationMs = Number(endHrTime - startHrTime) / 1000000;
  const memoryDeltaKB = Math.round((endMemory - startMemory) / 1024);

  return {
    rivalReleases: result.rivalReleases || [],
    financialSummary: result.financialSummary || { payroll: 0, movieCosts: 0, marketingCosts: 0 },
    telemetry: {
      durationMs: Number(durationMs.toFixed(2)),
      memoryDeltaKB,
      currentWeek: gameState.currentWeek,
      timestamp: new Date().toISOString(),
    },
  };
};