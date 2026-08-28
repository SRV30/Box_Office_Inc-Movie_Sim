/**
 * @fileoverview Regional & Global Cinema Market Engine (issue #545)
 *
 * Simulates distinct entertainment markets with audience preferences, localization,
 * cross-market releases, and per-market revenue calculation normalized to INR.
 */

import {
  CINEMA_MARKETS,
  CINEMA_MARKET_IDS,
  INDIAN_MARKETS,
  getMarketById,
} from "../../../constants/cinemaMarkets.js";
import { MAX_GROSS } from "./boxOfficeEngine.js";
import { getVerdict } from "../../../constants/verdicts.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Normalizes a local-currency amount to INR.
 */
export const normalizeToINR = (amount, marketId) => {
  const market = getMarketById(marketId);
  if (!market) return amount;
  return Math.round(amount * market.currencyToINR);
};

/**
 * Returns genre affinity multiplier for a market.
 */
export const getMarketGenreAffinity = (marketId, genre) => {
  const market = getMarketById(marketId);
  if (!market || !genre) return 1;
  return market.genreAffinities[genre] || 1;
};

/**
 * Returns talent pool region bonus when lead actor region matches market.
 */
export const getTalentRegionBonus = (marketId, talentRegion = "") => {
  const market = getMarketById(marketId);
  if (!market) return 1;

  if (!talentRegion) return 1;
  if (talentRegion === market.talentPoolRegion) return 1.2;

  const indianRegions = ["INDIA_HINDI", "INDIA_TELUGU", "INDIA_TAMIL"];
  if (
    indianRegions.includes(market.talentPoolRegion) &&
    indianRegions.includes(talentRegion)
  ) {
    return 1.08;
  }

  return 0.92;
};

/**
 * Calculates localization cost for releasing in a non-primary market.
 */
export const calculateLocalizationCost = (marketId, primaryMarketId, movie) => {
  if (marketId === primaryMarketId) return 0;

  const market = getMarketById(marketId);
  if (!market) return 0;

  let cost = market.localizationCostBase + (movie.budget || 0) * 0.015;

  if (
    INDIAN_MARKETS.includes(marketId) &&
    INDIAN_MARKETS.includes(primaryMarketId) &&
    movie.isCoProduction
  ) {
    cost *= 0.6;
  }

  return Math.round(cost);
};

/**
 * Cross-market release bonus (up to 12%).
 */
export const getCrossMarketBonus = (marketCount) => {
  if (marketCount <= 1) return 1;
  return 1 + Math.min(0.12, (marketCount - 1) * 0.03);
};

/**
 * Calculates revenue for a single cinema market.
 */
export const calculateSingleMarketRevenue = (
  movie,
  marketId,
  leadActor = {},
  director = {},
  primaryMarketId,
  rng = Math.random
) => {
  const market = getMarketById(marketId);
  if (!market) return null;

  const genre = movie.genre || "Drama";
  const genreAffinity = getMarketGenreAffinity(marketId, genre);
  const talentRegion = leadActor.region || leadActor.talentRegion || "";
  const talentBonus = getTalentRegionBonus(marketId, talentRegion);

  const budget = Math.max(movie.budget || 1000000, 500000);
  const qualityFactor = (movie.quality || 50) / 100;
  const hypeFactor = (movie.hype || 50) / 100;
  const starPower = ((leadActor.popularity || 50) / 100) * 0.4 + 0.6;
  const directorBoost = ((director.skill || director.popularity || 50) / 100) * 0.1 + 0.95;

  const baseRevenue =
    budget *
    market.productionCostMultiplier *
    market.audienceBase *
    genreAffinity *
    qualityFactor *
    hypeFactor *
    starPower *
    talentBonus *
    directorBoost;

  const variance = 0.75 + rng() * 0.5;
  let grossINR = Math.round(baseRevenue * variance * market.avgTicketPriceINR / 250);

  const localizationCost = calculateLocalizationCost(marketId, primaryMarketId, movie);
  const distributionFee = Math.round(grossINR * market.distributionFeePct);
  const netRevenue = Math.max(0, grossINR - localizationCost - distributionFee);

  const ticketsSold = Math.round(grossINR / market.avgTicketPriceINR);

  return {
    marketId,
    marketName: market.name,
    currency: market.currency,
    grossINR: clamp(grossINR, 0, MAX_GROSS),
    grossLocal: Math.round(grossINR / market.currencyToINR),
    netRevenue: clamp(netRevenue, 0, MAX_GROSS),
    localizationCost,
    distributionFee,
    ticketsSold,
    audienceReach: clamp(Math.round(ticketsSold / 1000), 0, 100),
    genreAffinity,
    talentBonus,
  };
};

/**
 * Calculates multi-market release revenue for targeted cinema markets.
 */
export const calculateMultiMarketRelease = (
  movie,
  leadActor = {},
  director = {},
  targetMarkets = [],
  primaryMarketId = CINEMA_MARKET_IDS.BOLLYWOOD,
  rng = Math.random
) => {
  const markets = targetMarkets.length > 0 ? targetMarkets : [primaryMarketId];
  const crossBonus = getCrossMarketBonus(markets.length);

  const marketResults = markets
    .map((marketId) =>
      calculateSingleMarketRevenue(movie, marketId, leadActor, director, primaryMarketId, rng)
    )
    .filter(Boolean);

  let totalWorldwide = marketResults.reduce((sum, m) => sum + m.grossINR, 0);
  totalWorldwide = Math.round(totalWorldwide * crossBonus);
  totalWorldwide = clamp(totalWorldwide, 0, MAX_GROSS);

  const primaryResult = marketResults.find((m) => m.marketId === primaryMarketId) || marketResults[0];
  const domesticGross = primaryResult ? primaryResult.grossINR : Math.round(totalWorldwide * 0.45);
  const internationalGross = clamp(totalWorldwide - domesticGross, 0, MAX_GROSS);

  const openingWeekend = Math.round(totalWorldwide * (0.28 + rng() * 0.08));
  const totalBudget = (movie.budget || 0) + (movie.marketingBudget || 0);
  const totalLocalization = marketResults.reduce((sum, m) => sum + m.localizationCost, 0);
  const profit = totalWorldwide - totalBudget - totalLocalization;
  const roi = totalBudget > 0 ? profit / totalBudget : 0;

  const regionalSplit = {
    northAmerica: marketResults.find((m) => m.marketId === CINEMA_MARKET_IDS.HOLLYWOOD)?.grossINR || 0,
    europe: 0,
    asiaPacific: marketResults
      .filter((m) =>
        [CINEMA_MARKET_IDS.BOLLYWOOD, CINEMA_MARKET_IDS.TOLLYWOOD, CINEMA_MARKET_IDS.KOLLYWOOD, CINEMA_MARKET_IDS.KOREAN, CINEMA_MARKET_IDS.JAPANESE].includes(
          m.marketId
        )
      )
      .reduce((sum, m) => sum + m.grossINR, 0),
    latinAmerica: 0,
  };

  return {
    markets: marketResults,
    totalWorldwide,
    worldwideGross: totalWorldwide,
    domesticGross: clamp(domesticGross, 0, MAX_GROSS),
    internationalGross,
    openingWeekend: clamp(openingWeekend, 0, MAX_GROSS),
    boxOffice: totalWorldwide,
    profit,
    roi,
    verdict: getVerdict(roi),
    regionalSplit,
    crossMarketBonus: crossBonus,
    totalLocalizationCost: totalLocalization,
  };
};

/**
 * Projects revenue for active movies without persisting.
 */
export const projectMarketRevenue = (movie, leadActor, director, targetMarkets, primaryMarketId) => {
  return calculateMultiMarketRelease(
    movie,
    leadActor,
    director,
    targetMarkets,
    primaryMarketId,
    () => 0.85
  );
};

export default calculateMultiMarketRelease;
