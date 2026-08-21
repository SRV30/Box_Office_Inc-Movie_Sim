import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSyndicationValuation,
  processWeeklySyndicationDeals,
} from "../src/services/simulation/engines/syndicationEngine.js";

describe("Syndication Engine Unit Tests", () => {
  it("calculateSyndicationValuation returns valid upfront and weekly figures", () => {
    const movie = {
      boxOffice: { worldwideGross: 50000000 },
      qualityScore: 85,
    };
    const valuation = calculateSyndicationValuation(movie);

    assert.ok(valuation.upfrontBonus > 0, "upfront bonus should be > 0");
    assert.ok(valuation.weeklyRoyalty > 0, "weekly royalty should be > 0");
    assert.strictEqual(valuation.maxDurationWeeks, 52);
  });

  it("processWeeklySyndicationDeals deducts remaining weeks and collects royalties", () => {
    const activeDeals = [
      { id: "1", weeklyRoyalty: 10000, weeksRemaining: 5, status: "ACTIVE" },
      { id: "2", weeklyRoyalty: 5000, weeksRemaining: 1, status: "ACTIVE" },
    ];

    const result = processWeeklySyndicationDeals(activeDeals);

    assert.strictEqual(result.totalPayout, 15000);
    assert.strictEqual(result.updatedDeals[0].weeksRemaining, 4);
    assert.strictEqual(result.updatedDeals[0].status, "ACTIVE");
    assert.strictEqual(result.updatedDeals[1].weeksRemaining, 0);
    assert.strictEqual(result.updatedDeals[1].status, "EXPIRED");
  });

  it("calculateSyndicationValuation adjusts duration and minimum floors for lower-rated films", () => {
    const lowRatedMovie = {
      budget: 100000,
      qualityScore: 35,
    };
    const valuation = calculateSyndicationValuation(lowRatedMovie);
    assert.strictEqual(valuation.maxDurationWeeks, 12);
    assert.ok(valuation.upfrontBonus >= 50000);
    assert.ok(valuation.weeklyRoyalty >= 5000);

    const midRatedMovie = {
      budget: 5000000,
      qualityScore: 65,
    };
    const midValuation = calculateSyndicationValuation(midRatedMovie);
    assert.strictEqual(midValuation.maxDurationWeeks, 26);
  });

  it("handles null movie and empty active deals array gracefully", () => {
    const nullValuation = calculateSyndicationValuation(null);
    assert.strictEqual(nullValuation.upfrontBonus, 0);
    assert.strictEqual(nullValuation.weeklyRoyalty, 0);

    const emptyDeals = processWeeklySyndicationDeals([]);
    assert.strictEqual(emptyDeals.totalPayout, 0);
    assert.deepStrictEqual(emptyDeals.updatedDeals, []);
  });
});
