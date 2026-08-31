import { describe, it } from "node:test";
import assert from "node:assert";
import {
  CEREMONY_CONFIGS,
  calculateCategoryScore,
  processCeremony,
} from "../src/services/simulation/engines/awardCeremonyV2Engine.js";

describe("Award Ceremony V2 Engine Unit Tests", () => {
  it("initializes ceremony configurations with correct categories and prestige multipliers", () => {
    assert.ok(CEREMONY_CONFIGS.GLOBAL_ACADEMY);
    assert.strictEqual(CEREMONY_CONFIGS.GLOBAL_ACADEMY.scope, "GLOBAL");
    assert.strictEqual(CEREMONY_CONFIGS.GLOBAL_ACADEMY.prestigeMultiplier, 2.0);
    assert.strictEqual(CEREMONY_CONFIGS.NATIONAL_INDIE_SPIRIT.scope, "NATIONAL");
  });

  it("calculates category scores deterministically based on film quality, critic score, and FYC spend", () => {
    const mockMovie = {
      quality: 85,
      criticScore: 90,
      audienceScore: 80,
      budget: 15000000,
    };

    const scoreNoFyc = calculateCategoryScore(mockMovie, "BEST_PICTURE", 0, "BALANCED");
    const scoreWithFyc = calculateCategoryScore(mockMovie, "BEST_PICTURE", 50000, "BALANCED");

    assert.ok(scoreNoFyc > 0);
    assert.ok(scoreWithFyc > scoreNoFyc);
  });

  it("applies jury bias multipliers correctly for auteur vs commercial panels", () => {
    const highQualityFilm = { quality: 90, criticScore: 95, audienceScore: 70 };

    const scoreAuteur = calculateCategoryScore(highQualityFilm, "BEST_DIRECTOR", 0, "ARTISTIC_AUTEUR");
    const scoreBalanced = calculateCategoryScore(highQualityFilm, "BEST_DIRECTOR", 0, "BALANCED");

    assert.ok(scoreAuteur > scoreBalanced);
  });
});
