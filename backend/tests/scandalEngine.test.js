import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SCANDAL_TYPES,
  PR_STRATEGIES,
  calculateScandalProbability,
  evaluatePRStrategy,
  calculateMovieBoxOfficeModifier,
  processWeeklyScandals,
} from "../src/services/simulation/engines/scandalEngine.js";

describe("Celebrity Scandal & Reputation Recovery Engine Tests", () => {
  it("should have all 6 required scandal types defined with correct severity and baseline properties", () => {
    const requiredTypes = [
      "DRUG_USE",
      "AFFAIR",
      "ASSAULT_ALLEGATION",
      "POLITICAL_CONTROVERSY",
      "TAX_FRAUD",
      "LEAKED_VIDEOS",
    ];

    for (const type of requiredTypes) {
      assert.ok(SCANDAL_TYPES[type], `Scandal type ${type} should exist`);
      assert.ok(SCANDAL_TYPES[type].baseOutrage > 0);
      assert.ok(SCANDAL_TYPES[type].popularityPenalty > 0);
      assert.ok(SCANDAL_TYPES[type].boxOfficePenalty > 0);
      assert.ok(SCANDAL_TYPES[type].baseDrain > 0);
    }
  });

  it("calculates scandal probability based on celebrity fame and studio reputation", () => {
    const superstar = { popularity: 95 };
    const rookie = { popularity: 20 };
    const lowRepStudio = { reputation: 25 };

    const probSuperstar = calculateScandalProbability(superstar, lowRepStudio);
    const probRookie = calculateScandalProbability(rookie, { reputation: 80 });

    assert.ok(probSuperstar > probRookie, "Superstar with stressed studio should have higher risk");
    assert.ok(probSuperstar <= 0.25);
    assert.ok(probRookie >= 0.01);
  });

  it("handles insufficient funds when evaluating PR strategies", () => {
    const scandal = {
      talentName: "John Star",
      publicOutrage: 80,
      status: "ACTIVE",
      evidenceStatus: "LEAKED_EVIDENCE",
      recoveryProgress: 0,
    };

    const outcome = evaluatePRStrategy(scandal, "CRISIS_SETTLEMENT", 10000);
    assert.strictEqual(outcome.success, false);
    assert.strictEqual(outcome.reason, "INSUFFICIENT_FUNDS");
  });

  it("successfully applies PR strategies and reduces public outrage", () => {
    const scandal = {
      talentName: "Jane Luminary",
      publicOutrage: 75,
      status: "ACTIVE",
      evidenceStatus: "LEAKED_EVIDENCE",
      recoveryProgress: 10,
      boxOfficeImpactPercent: 30,
      reputationDrainPerWeek: 6,
    };

    const outcome = evaluatePRStrategy(scandal, "PUBLIC_APOLOGY", 1000000);
    assert.strictEqual(outcome.success, true);
    assert.ok(outcome.publicOutrage < 75 || outcome.publicOutrage <= 100);
    assert.ok(outcome.recoveryProgress > 10);
  });

  it("evaluates movie box office penalties for cast/crew involved in scandals", () => {
    const movie = {
      _id: "m1",
      cast: [{ actorId: "actor_123" }],
      directorId: "dir_456",
    };

    const activeScandals = [
      {
        talentId: "actor_123",
        status: "ACTIVE",
        boxOfficeImpactPercent: 25,
      },
    ];

    const modifierWithScandal = calculateMovieBoxOfficeModifier(movie, activeScandals);
    const modifierWithoutScandal = calculateMovieBoxOfficeModifier(movie, []);

    assert.strictEqual(modifierWithoutScandal, 1.0);
    assert.strictEqual(modifierWithScandal, 0.75);
  });

  it("processes weekly scandal decay, reputation drain, and recovery progress", () => {
    const scandals = [
      {
        _id: "s1",
        status: "ACTIVE",
        reputationDrainPerWeek: 5,
        publicOutrage: 60,
        weeksActive: 5,
        recoveryProgress: 20,
      },
      {
        _id: "s2",
        status: "CONTAINED",
        reputationDrainPerWeek: 0,
        publicOutrage: 30,
        weeksActive: 2,
        recoveryProgress: 50,
      },
    ];

    const result = processWeeklyScandals(scandals, 6);
    assert.strictEqual(result.totalReputationDrain, 5);
    assert.strictEqual(result.updatedScandals.length, 2);

    const activeScandal = result.updatedScandals[0];
    const containedScandal = result.updatedScandals[1];

    assert.strictEqual(activeScandal.weeksActive, 6);
    assert.ok(activeScandal.recoveryProgress >= 30);
    assert.ok(containedScandal.recoveryProgress >= 75);
  });

  it("marks scandal as RECOVERED once recovery progress hits 100", () => {
    const scandals = [
      {
        _id: "s3",
        status: "CONTAINED",
        reputationDrainPerWeek: 0,
        publicOutrage: 10,
        weeksActive: 6,
        recoveryProgress: 90,
      },
    ];

    const result = processWeeklyScandals(scandals, 7);
    const recovered = result.updatedScandals[0];
    assert.strictEqual(recovered.status, "RECOVERED");
    assert.strictEqual(recovered.publicOutrage, 0);
    assert.strictEqual(recovered.boxOfficeImpactPercent, 0);
  });
});
