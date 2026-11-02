import "./helpers/testEnv.js";

import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateMovieProfitability,
  PROFITABILITY_STATUS,
} from "../src/utils/movieProfitability.js";

test("calculateMovieProfitability reports a profitable movie without double counting", () => {
  const movie = {
    _id: "movie-1",
    title: "Galactic Odyssey",
    status: "RELEASED",
    releaseType: "THEATRICAL",
    budget: 100000000,
    marketingBudget: 20000000,
    budgetBreakdown: {
      scriptCost: 10000000,
      directorCost: 20000000,
      leadActorCost: 20000000,
      supportingActorCost: 10000000,
      crewCost: 15000000,
      soundtrackCost: 5000000,
      marketingCost: 20000000,
    },
    worldwideGross: 150000000,
    boxOffice: 150000000,
    merchandiseRevenue: 10000000,
    soundtrackRevenue: 5000000,
    // Already included in worldwideGross - must not be added again.
    reReleaseRevenue: 25000000,
    cinemaMarketRevenue: [
      {
        marketId: "north-america",
        grossINR: 30000000,
        localizationCost: 2000000,
      },
    ],
  };

  const result = calculateMovieProfitability(movie);

  assert.equal(result.profitabilityStatus, PROFITABILITY_STATUS.PROFITABLE);
  assert.equal(result.profitabilityLabel, "Profitable");
  assert.equal(result.revenue.boxOffice, 150000000);
  assert.equal(result.revenue.merchandise, 10000000);
  assert.equal(result.revenue.soundtrack, 5000000);
  assert.equal(result.revenue.total, 165000000);
  assert.equal(result.revenue.reRelease, 25000000);
  assert.equal(result.revenue.cinemaMarkets, 30000000);
  assert.equal(result.expenses.production, 80000000);
  assert.equal(result.expenses.marketing, 20000000);
  assert.equal(result.expenses.localization, 2000000);
  assert.equal(result.expenses.total, 102000000);
  assert.equal(result.expenses.productionCostSource, "budgetBreakdown");
  assert.equal(result.expenses.productionComponents.soundtrackCost, 5000000);
  assert.equal(result.netProfit, 63000000);
  assert.equal(result.roiPercent, 61.76);
  assert.equal(result.profitMargin, 38.18);
  assert.equal(result.hasFinancialRecords, true);
});

test("calculateMovieProfitability handles legacy movies without a breakdown", () => {
  const result = calculateMovieProfitability({
    title: "Legacy Feature",
    status: "RELEASED",
    budget: 50000000,
    marketingBudget: 5000000,
    worldwideGross: 70000000,
  });

  assert.equal(result.expenses.production, 50000000);
  assert.equal(result.expenses.productionCostSource, "budget");
  assert.equal(result.expenses.marketing, 5000000);
  assert.equal(result.expenses.total, 55000000);
  assert.equal(result.revenue.total, 70000000);
  assert.equal(result.netProfit, 15000000);
  assert.equal(result.roiPercent, 27.27);
  assert.equal(result.profitabilityStatus, PROFITABILITY_STATUS.PROFITABLE);
});

test("calculateMovieProfitability uses the larger marketing value after extra campaigns", () => {
  const result = calculateMovieProfitability({
    budget: 60000000,
    marketingBudget: 8000000,
    budgetBreakdown: {
      scriptCost: 10000000,
      directorCost: 20000000,
      leadActorCost: 20000000,
      crewCost: 0,
      marketingCost: 5000000,
    },
    worldwideGross: 60000000,
  });

  assert.equal(result.expenses.production, 50000000);
  assert.equal(result.expenses.marketing, 8000000);
  assert.equal(result.expenses.total, 58000000);
  assert.equal(result.netProfit, 2000000);
});

test("calculateMovieProfitability reports a loss and negative ROI", () => {
  const result = calculateMovieProfitability({
    title: "Night Train",
    status: "RELEASED",
    budget: 10000000,
    worldwideGross: 6000000,
  });

  assert.equal(result.expenses.total, 10000000);
  assert.equal(result.netProfit, -4000000);
  assert.equal(result.roiPercent, -40);
  assert.equal(result.profitMargin, -66.67);
  assert.equal(result.profitabilityStatus, PROFITABILITY_STATUS.LOSS);
  assert.equal(result.profitabilityLabel, "Loss");
});

test("calculateMovieProfitability reports break-even when revenue equals expenses", () => {
  const result = calculateMovieProfitability({
    title: "Exact Match",
    status: "RELEASED",
    budget: 5000000,
    worldwideGross: 5000000,
  });

  assert.equal(result.netProfit, 0);
  assert.equal(result.roiPercent, 0);
  assert.equal(result.profitMargin, 0);
  assert.equal(result.profitabilityStatus, PROFITABILITY_STATUS.BREAK_EVEN);
});

test("calculateMovieProfitability supports streaming releases stored in boxOffice", () => {
  const result = calculateMovieProfitability({
    title: "Streaming Original",
    status: "RELEASED_STREAMING",
    releaseType: "STREAMING",
    budget: 30000000,
    marketingBudget: 5000000,
    worldwideGross: 0,
    boxOffice: 40000000,
  });

  assert.equal(result.revenue.boxOffice, 40000000);
  assert.equal(result.expenses.total, 35000000);
  assert.equal(result.netProfit, 5000000);
  assert.equal(result.profitabilityStatus, PROFITABILITY_STATUS.PROFITABLE);
  assert.equal(result.isReleased, true);
});

test("calculateMovieProfitability handles missing financial records", () => {
  const result = calculateMovieProfitability({});

  assert.equal(result.movieId, null);
  assert.equal(result.hasFinancialRecords, false);
  assert.equal(result.revenue.total, 0);
  assert.equal(result.expenses.total, 0);
  assert.equal(result.netProfit, 0);
  assert.equal(result.roiPercent, 0);
  assert.equal(result.profitMargin, 0);
  assert.equal(result.profitabilityStatus, PROFITABILITY_STATUS.BREAK_EVEN);
  assert.equal(result.isReleased, false);
});
