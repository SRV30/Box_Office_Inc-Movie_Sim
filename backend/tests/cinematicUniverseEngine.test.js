import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateUniverseSynergy } from "../src/services/cinematicUniverseEngine.js";

describe("Cinematic Universe Engine Unit Tests", () => {
  it("calculateUniverseSynergy applies crossover bonus and movie count synergy", () => {
    const movieCount = 4;
    const fatigueIndex = 10;
    const isCrossover = true;

    const synergy = calculateUniverseSynergy(movieCount, fatigueIndex, isCrossover);

    assert.ok(synergy.netSynergyMultiplier > 1.3, "Net synergy multiplier should exceed 1.3 for 4-movie crossover");
    assert.strictEqual(synergy.crossoverBonus, 25);
    assert.strictEqual(synergy.baseSynergy, 20);
  });

  it("calculateUniverseSynergy applies fatigue penalty for oversaturated universe", () => {
    const movieCount = 8;
    const fatigueIndex = 80;
    const isCrossover = false;

    const synergy = calculateUniverseSynergy(movieCount, fatigueIndex, isCrossover);

    assert.strictEqual(synergy.fatiguePenalty, 24);
  });
});
