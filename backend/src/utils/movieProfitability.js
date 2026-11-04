/**
 * @fileoverview Canonical movie-level profitability calculation.
 *
 * The simulation stores money across several fields that overlap:
 * - `budget` is the all-in production budget captured at greenlight and
 *   already includes marketing + soundtrack costs for movies created through
 *   the normal flow.
 * - `marketingBudget` is also stored separately, and may grow when extra
 *   campaigns are purchased after greenlight.
 * - `worldwideGross`/`boxOffice` already include theatrical, re-release, and
 *   streaming deal revenue.
 * - `cinemaMarketRevenue[].grossINR` is already folded into the worldwide
 *   gross and must not be counted again.
 *
 * This module is the single source of truth for turning those fields into a
 * revenue / expense / net-profit breakdown without double counting.
 */

export const PROFITABILITY_STATUS = Object.freeze({
  PROFITABLE: "PROFITABLE",
  LOSS: "LOSS",
  BREAK_EVEN: "BREAK_EVEN",
});

export const PROFITABILITY_LABELS = Object.freeze({
  [PROFITABILITY_STATUS.PROFITABLE]: "Profitable",
  [PROFITABILITY_STATUS.LOSS]: "Loss",
  [PROFITABILITY_STATUS.BREAK_EVEN]: "Break-even",
});

const toNonNegativeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundCurrency = (value) => Math.round(toFiniteNumber(value));

const roundPercent = (value) =>
  Math.round((toFiniteNumber(value) + Number.EPSILON) * 100) / 100;

const sumProductionComponents = (components) =>
  Object.values(components).reduce((total, cost) => total + cost, 0);

const extractBudgetBreakdown = (movie) => {
  const breakdown = movie?.budgetBreakdown || {};

  const productionComponents = {
    scriptCost: toNonNegativeNumber(breakdown.scriptCost),
    directorCost: toNonNegativeNumber(breakdown.directorCost),
    leadActorCost: toNonNegativeNumber(breakdown.leadActorCost),
    supportingActorCost: toNonNegativeNumber(breakdown.supportingActorCost),
    crewCost: toNonNegativeNumber(breakdown.crewCost),
    soundtrackCost: toNonNegativeNumber(breakdown.soundtrackCost),
  };

  return {
    productionComponents,
    productionTotal: sumProductionComponents(productionComponents),
    marketingCost: toNonNegativeNumber(breakdown.marketingCost),
  };
};

const calculateLocalizationExpenses = (movie) => {
  if (!Array.isArray(movie?.cinemaMarketRevenue)) return 0;

  return movie.cinemaMarketRevenue.reduce(
    (total, market) => total + toNonNegativeNumber(market?.localizationCost),
    0
  );
};

/**
 * Calculates a movie-level revenue, expense, net profit, ROI, and
 * profitability status summary.
 *
 * @param {object} movie - Movie document or plain movie object.
 * @returns {object} Canonical profitability report.
 */
export const calculateMovieProfitability = (movie = {}) => {
  const budget = toNonNegativeNumber(movie.budget);
  const marketingBudget = toNonNegativeNumber(movie.marketingBudget);
  const { productionComponents, productionTotal, marketingCost } =
    extractBudgetBreakdown(movie);

  // Prefer the per-line breakdown when it exists; fall back to the flat
  // budget for legacy/manually created movies that never stored a breakdown.
  const hasProductionBreakdown = productionTotal > 0;
  const productionExpenses = hasProductionBreakdown ? productionTotal : budget;
  // `marketingBudget` can be increased after greenlight (extra campaigns), so
  // the larger of the two values is the most complete marketing expense.
  const marketingExpenses = Math.max(marketingBudget, marketingCost);
  const localizationExpenses = calculateLocalizationExpenses(movie);
  const totalExpenses =
    productionExpenses + marketingExpenses + localizationExpenses;

  const boxOfficeRevenue =
    toNonNegativeNumber(movie.worldwideGross) ||
    toNonNegativeNumber(movie.boxOffice);
  const merchandiseRevenue = toNonNegativeNumber(movie.merchandiseRevenue);
  const soundtrackRevenue = toNonNegativeNumber(movie.soundtrackRevenue);
  const totalRevenue =
    boxOfficeRevenue + merchandiseRevenue + soundtrackRevenue;

  const netProfit = roundCurrency(totalRevenue - totalExpenses);
  const hasFinancialRecords = totalRevenue > 0 || totalExpenses > 0;

  let profitabilityStatus = PROFITABILITY_STATUS.BREAK_EVEN;
  if (hasFinancialRecords && netProfit > 0) {
    profitabilityStatus = PROFITABILITY_STATUS.PROFITABLE;
  } else if (hasFinancialRecords && netProfit < 0) {
    profitabilityStatus = PROFITABILITY_STATUS.LOSS;
  }

  const roiPercent =
    totalExpenses > 0 ? roundPercent((netProfit / totalExpenses) * 100) : 0;
  const profitMargin =
    totalRevenue > 0 ? roundPercent((netProfit / totalRevenue) * 100) : 0;

  return {
    movieId: movie._id ? String(movie._id) : null,
    title: movie.title || "",
    releaseType: movie.releaseType || "THEATRICAL",
    movieStatus: movie.status || null,
    isReleased: ["RELEASED", "RELEASED_STREAMING"].includes(movie.status),
    currency: "INR",
    hasFinancialRecords,
    revenue: {
      boxOffice: boxOfficeRevenue,
      merchandise: merchandiseRevenue,
      soundtrack: soundtrackRevenue,
      total: totalRevenue,
      // Informational only. Both values are already included in boxOffice.
      reRelease: toNonNegativeNumber(movie.reReleaseRevenue),
      cinemaMarkets: Array.isArray(movie.cinemaMarketRevenue)
        ? movie.cinemaMarketRevenue.reduce(
            (total, market) => total + toNonNegativeNumber(market?.grossINR),
            0
          )
        : 0,
    },
    expenses: {
      production: productionExpenses,
      marketing: marketingExpenses,
      localization: localizationExpenses,
      total: totalExpenses,
      productionCostSource: hasProductionBreakdown
        ? "budgetBreakdown"
        : "budget",
      productionComponents,
    },
    netProfit,
    roiPercent,
    profitMargin,
    profitabilityStatus,
    profitabilityLabel: PROFITABILITY_LABELS[profitabilityStatus],
  };
};

export default calculateMovieProfitability;
