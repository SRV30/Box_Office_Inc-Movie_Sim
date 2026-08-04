import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateTerritoryDealOffer } from "../src/services/simulation/engines/territoryEngine.js";

describe("Territory Engine Unit Tests", () => {
  it("calculateTerritoryDealOffer returns correct structure for MINIMUM_GUARANTEE", () => {
    const movie = { budget: 10000000, qualityScore: 80 };
    const offer = calculateTerritoryDealOffer(movie, "EUROPE", "MINIMUM_GUARANTEE");

    assert.ok(offer.minimumGuarantee > 0);
    assert.strictEqual(offer.revenueSharePct, 15);
    assert.ok(offer.localizationCost > 0);
  });

  it("calculateTerritoryDealOffer yields higher revenue share for REVENUE_SHARE deal", () => {
    const movie = { budget: 10000000, qualityScore: 80 };
    const offer = calculateTerritoryDealOffer(movie, "ASIA_PACIFIC", "REVENUE_SHARE");

    assert.strictEqual(offer.revenueSharePct, 55);
  });
});
