import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculateUniverseSynergy } from "../src/utils/franchiseSynergyCalculator.js";
import { calculateCrossoverHype, calculateUniverseFatigue, evaluateLoreConsistency } from "../src/services/simulation/engines/franchiseEngine.js";

describe("Franchise Ecosystem Unit Tests", () => {
  test("calculateUniverseSynergy applies quality bonus and fatigue penalty", () => {
    const synergy = calculateUniverseSynergy(3, 90);
    assert.ok(synergy.netMultiplier >= 1.0);
    assert.ok(synergy.hypeBonus > 0);
  });

  test("calculateCrossoverHype boosts hype with sub-franchise count", () => {
    const crossoverMultiplier = calculateCrossoverHype(3, 90);
    assert.ok(crossoverMultiplier > 1.0);
  });

  test("calculateUniverseFatigue returns zero fatigue for 2 or fewer releases per year", () => {
    const result = calculateUniverseFatigue(2);
    assert.equal(result.fatigueScore, 0);
    assert.equal(result.decayMultiplier, 1.0);
  });

  test("calculateUniverseFatigue penalizes excessive franchise releases", () => {
    const result = calculateUniverseFatigue(5);
    assert.ok(result.fatigueScore > 0);
    assert.ok(result.decayMultiplier < 1.0);
  });

  test("evaluateLoreConsistency increases score when original writer stays", () => {
    const updated = evaluateLoreConsistency(80, true);
    assert.equal(updated, 85);
  });

  test("evaluateLoreConsistency penalizes when lead writer is replaced", () => {
    const updated = evaluateLoreConsistency(80, false);
    assert.equal(updated, 65);
  });

  test("calculateUniverseSynergy clamps netMultiplier within [0.5, 2.5]", () => {
    const hugeSynergy = calculateUniverseSynergy(15, 100, 0.01);
    assert.ok(hugeSynergy.netMultiplier <= 2.5);
    const lowSynergy = calculateUniverseSynergy(20, 10, 0.30);
    assert.ok(lowSynergy.netMultiplier >= 0.5);
  });

  test("calculateCrossoverHype respects lore consistency weighting", () => {
    const highLoreHype = calculateCrossoverHype(4, 100);
    const lowLoreHype = calculateCrossoverHype(4, 50);
    assert.ok(highLoreHype > lowLoreHype);
  });
});

