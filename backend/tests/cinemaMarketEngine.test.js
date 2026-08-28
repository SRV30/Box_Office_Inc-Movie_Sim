import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeToINR,
  getMarketGenreAffinity,
  getTalentRegionBonus,
  calculateLocalizationCost,
  getCrossMarketBonus,
  calculateSingleMarketRevenue,
  calculateMultiMarketRelease,
} from "../src/services/simulation/engines/cinemaMarketEngine.js";
import { CINEMA_MARKET_IDS } from "../src/constants/cinemaMarkets.js";

describe("Cinema Market Engine (issue #545)", () => {
  const baseMovie = {
    title: "Test Film",
    genre: "Action",
    budget: 50000000,
    marketingBudget: 10000000,
    quality: 75,
    hype: 80,
  };

  const leadActor = { popularity: 85, region: "INDIA_HINDI" };
  const director = { skill: 70 };

  it("normalizes currency amounts to INR", () => {
    assert.strictEqual(normalizeToINR(100, CINEMA_MARKET_IDS.BOLLYWOOD), 100);
    assert.strictEqual(normalizeToINR(1, CINEMA_MARKET_IDS.HOLLYWOOD), 83);
  });

  it("returns distinct genre affinities per market", () => {
    const bollywoodRomance = getMarketGenreAffinity(CINEMA_MARKET_IDS.BOLLYWOOD, "Romance");
    const hollywoodRomance = getMarketGenreAffinity(CINEMA_MARKET_IDS.HOLLYWOOD, "Romance");
    const japaneseAnimation = getMarketGenreAffinity(CINEMA_MARKET_IDS.JAPANESE, "Animation");

    assert.ok(bollywoodRomance > hollywoodRomance);
    assert.strictEqual(japaneseAnimation, 1.5);
  });

  it("applies talent region bonus for matching pools", () => {
    const match = getTalentRegionBonus(CINEMA_MARKET_IDS.BOLLYWOOD, "INDIA_HINDI");
    const mismatch = getTalentRegionBonus(CINEMA_MARKET_IDS.HOLLYWOOD, "INDIA_HINDI");

    assert.strictEqual(match, 1.2);
    assert.ok(mismatch < 1);
  });

  it("calculates localization cost for cross-market releases", () => {
    const cost = calculateLocalizationCost(CINEMA_MARKET_IDS.HOLLYWOOD, CINEMA_MARKET_IDS.BOLLYWOOD, baseMovie);
    const noCost = calculateLocalizationCost(CINEMA_MARKET_IDS.BOLLYWOOD, CINEMA_MARKET_IDS.BOLLYWOOD, baseMovie);

    assert.ok(cost > noCost);
    assert.strictEqual(noCost, 0);
  });

  it("applies cross-market release bonus", () => {
    assert.strictEqual(getCrossMarketBonus(1), 1);
    assert.ok(getCrossMarketBonus(3) > 1);
    assert.ok(getCrossMarketBonus(6) <= 1.12);
  });

  it("calculates single market revenue with distinct parameters", () => {
    const rng = () => 0.9;
    const bollywood = calculateSingleMarketRevenue(
      baseMovie,
      CINEMA_MARKET_IDS.BOLLYWOOD,
      leadActor,
      director,
      CINEMA_MARKET_IDS.BOLLYWOOD,
      rng
    );
    const hollywood = calculateSingleMarketRevenue(
      baseMovie,
      CINEMA_MARKET_IDS.HOLLYWOOD,
      { popularity: 85, region: "US" },
      director,
      CINEMA_MARKET_IDS.BOLLYWOOD,
      rng
    );

    assert.ok(bollywood.grossINR > 0);
    assert.ok(hollywood.grossINR > 0);
    assert.notStrictEqual(bollywood.grossINR, hollywood.grossINR);
    assert.ok(hollywood.localizationCost > bollywood.localizationCost);
  });

  it("calculates multi-market global release revenue", () => {
    const rng = () => 0.85;
    const result = calculateMultiMarketRelease(
      baseMovie,
      leadActor,
      director,
      [CINEMA_MARKET_IDS.BOLLYWOOD, CINEMA_MARKET_IDS.TOLLYWOOD, CINEMA_MARKET_IDS.HOLLYWOOD],
      CINEMA_MARKET_IDS.BOLLYWOOD,
      rng
    );

    assert.strictEqual(result.markets.length, 3);
    assert.ok(result.totalWorldwide > 0);
    assert.ok(result.crossMarketBonus > 1);
    assert.ok(result.worldwideGross >= result.domesticGross);
    assert.ok(result.profit !== undefined);
    assert.ok(result.verdict);
  });

  it("single-market release matches primary market domestic gross", () => {
    const rng = () => 0.8;
    const result = calculateMultiMarketRelease(
      baseMovie,
      leadActor,
      director,
      [CINEMA_MARKET_IDS.KOLLYWOOD],
      CINEMA_MARKET_IDS.KOLLYWOOD,
      rng
    );

    assert.strictEqual(result.markets.length, 1);
    assert.strictEqual(result.crossMarketBonus, 1);
    assert.strictEqual(result.domesticGross, result.markets[0].grossINR);
  });
});
