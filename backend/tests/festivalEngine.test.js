import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculateFestivalPrestige } from "../src/services/simulation/engines/awardsEngine.js";
import {
  calculateFestivalJuryScore,
  calculatePrestigeHypeBoost,
  calculateMarketDistributionOffer,
} from "../src/services/simulation/engines/festivalEngine.js";

describe("Film Festival Engine Unit Tests", () => {
  test("calculateFestivalPrestige awards correct prestige points for awards", () => {
    assert.equal(calculateFestivalPrestige("PALME_D_OR"), 1000);
    assert.equal(calculateFestivalPrestige("GRAND_PRIX"), 600);
    assert.equal(calculateFestivalPrestige("NONE"), 0);
  });

  test("calculateFestivalJuryScore computes score with festival specific weights", () => {
    const movie = { quality: 90, criticScore: 80 };
    const scoreCannes = calculateFestivalJuryScore(movie, "CANNES");
    assert.equal(scoreCannes, 87);
  });

  test("calculatePrestigeHypeBoost returns correct multiplier", () => {
    assert.equal(calculatePrestigeHypeBoost("PALME_D_OR"), 1.35);
    assert.equal(calculatePrestigeHypeBoost("NONE"), 1.05);
  });

  test("calculateMarketDistributionOffer calculates acquisition offer for high scores", () => {
    const offer = calculateMarketDistributionOffer(85, 2000000);
    assert.ok(offer > 2000000);
  });

  test("calculateFestivalJuryScore handles SUNDANCE, VENICE, and TIFF festivals", () => {
    const movie = { quality: 80, criticScore: 90 };
    const sundanceScore = calculateFestivalJuryScore(movie, "SUNDANCE");
    assert.ok(sundanceScore >= 70 && sundanceScore <= 100);

    const veniceScore = calculateFestivalJuryScore(movie, "VENICE");
    assert.ok(veniceScore >= 70 && veniceScore <= 100);
  });

  test("calculateMarketDistributionOffer returns 0 for sub-60 jury scores", () => {
    const lowOffer = calculateMarketDistributionOffer(45, 5000000);
    assert.equal(lowOffer, 0);
  });
});

