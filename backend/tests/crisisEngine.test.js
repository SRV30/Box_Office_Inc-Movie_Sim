import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateCrisisResolution,
  calculateWeeklyReputationImpact,
} from "../src/services/simulation/engines/crisisEngine.js";

describe("Crisis Engine Unit Tests", () => {
  it("evaluateCrisisResolution calculates cost and damage mitigation", () => {
    const crisis = { reputationDamagePerWeek: 20 };
    const resolution = evaluateCrisisResolution(crisis, "SETTLEMENT_PAYOUT");

    assert.strictEqual(resolution.cost, 250000);
    assert.strictEqual(resolution.damageMitigated, 18);
  });

  it("calculateWeeklyReputationImpact sums damage of active crises", () => {
    const activeCrises = [
      { status: "ACTIVE", reputationDamagePerWeek: 10 },
      { status: "RESOLVED", reputationDamagePerWeek: 15 },
      { status: "ACTIVE", reputationDamagePerWeek: 5 },
    ];
    const totalDamage = calculateWeeklyReputationImpact(activeCrises);

    assert.strictEqual(totalDamage, 15);
  });

  it("evaluateCrisisResolution handles all standard PR strategies", () => {
    const crisis = { reputationDamagePerWeek: 10 };
    const apology = evaluateCrisisResolution(crisis, "PUBLIC_APOLOGY");
    assert.strictEqual(apology.cost, 50000);
    assert.strictEqual(apology.damageMitigated, 5);

    const pressTour = evaluateCrisisResolution(crisis, "PRESS_TOUR");
    assert.strictEqual(pressTour.cost, 100000);
    assert.strictEqual(pressTour.damageMitigated, 7);

    const legal = evaluateCrisisResolution(crisis, "LEGAL_ACTION");
    assert.strictEqual(legal.cost, 500000);
    assert.strictEqual(legal.damageMitigated, 10);
  });

  it("handles null crisis and empty active crises array gracefully", () => {
    const res = evaluateCrisisResolution(null, "PUBLIC_APOLOGY");
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.cost, 0);

    const total = calculateWeeklyReputationImpact([]);
    assert.strictEqual(total, 0);
  });
});
