/**
 * Regional and global cinema market definitions (issue #545).
 * Each market has distinct audience, budget, genre, and distribution parameters.
 */

export const CINEMA_MARKET_IDS = {
  BOLLYWOOD: "BOLLYWOOD",
  TOLLYWOOD: "TOLLYWOOD",
  KOLLYWOOD: "KOLLYWOOD",
  HOLLYWOOD: "HOLLYWOOD",
  KOREAN: "KOREAN",
  JAPANESE: "JAPANESE",
};

export const CINEMA_MARKETS = {
  [CINEMA_MARKET_IDS.BOLLYWOOD]: {
    id: CINEMA_MARKET_IDS.BOLLYWOOD,
    name: "Bollywood (Hindi)",
    region: "SOUTH_ASIA",
    currency: "INR",
    currencyToINR: 1,
    audienceBase: 1.0,
    avgTicketPriceINR: 280,
    productionCostMultiplier: 0.85,
    distributionFeePct: 0.22,
    genreAffinities: { Drama: 1.3, Romance: 1.45, Action: 1.2, Comedy: 1.25 },
    talentPoolRegion: "INDIA_HINDI",
    localizationCostBase: 0,
  },
  [CINEMA_MARKET_IDS.TOLLYWOOD]: {
    id: CINEMA_MARKET_IDS.TOLLYWOOD,
    name: "Tollywood (Telugu)",
    region: "SOUTH_ASIA",
    currency: "INR",
    currencyToINR: 1,
    audienceBase: 0.55,
    avgTicketPriceINR: 220,
    productionCostMultiplier: 0.7,
    distributionFeePct: 0.2,
    genreAffinities: { Action: 1.4, Drama: 1.15, Romance: 1.2 },
    talentPoolRegion: "INDIA_TELUGU",
    localizationCostBase: 150000,
  },
  [CINEMA_MARKET_IDS.KOLLYWOOD]: {
    id: CINEMA_MARKET_IDS.KOLLYWOOD,
    name: "Kollywood (Tamil)",
    region: "SOUTH_ASIA",
    currency: "INR",
    currencyToINR: 1,
    audienceBase: 0.5,
    avgTicketPriceINR: 210,
    productionCostMultiplier: 0.72,
    distributionFeePct: 0.2,
    genreAffinities: { Action: 1.35, Drama: 1.2, Thriller: 1.25 },
    talentPoolRegion: "INDIA_TAMIL",
    localizationCostBase: 150000,
  },
  [CINEMA_MARKET_IDS.HOLLYWOOD]: {
    id: CINEMA_MARKET_IDS.HOLLYWOOD,
    name: "Hollywood (US)",
    region: "NORTH_AMERICA",
    currency: "USD",
    currencyToINR: 83,
    audienceBase: 1.2,
    avgTicketPriceINR: 996,
    productionCostMultiplier: 1.4,
    distributionFeePct: 0.3,
    genreAffinities: { Action: 1.3, "Sci-Fi": 1.35, Horror: 1.2, Animation: 1.25 },
    talentPoolRegion: "US",
    localizationCostBase: 2500000,
  },
  [CINEMA_MARKET_IDS.KOREAN]: {
    id: CINEMA_MARKET_IDS.KOREAN,
    name: "Korean Cinema",
    region: "EAST_ASIA",
    currency: "KRW",
    currencyToINR: 0.063,
    audienceBase: 0.45,
    avgTicketPriceINR: 720,
    productionCostMultiplier: 0.9,
    distributionFeePct: 0.25,
    genreAffinities: { Drama: 1.4, Thriller: 1.3, Romance: 1.25, Horror: 1.2 },
    talentPoolRegion: "KOREA",
    localizationCostBase: 1800000,
  },
  [CINEMA_MARKET_IDS.JAPANESE]: {
    id: CINEMA_MARKET_IDS.JAPANESE,
    name: "Japanese Cinema",
    region: "EAST_ASIA",
    currency: "JPY",
    currencyToINR: 0.56,
    audienceBase: 0.4,
    avgTicketPriceINR: 840,
    productionCostMultiplier: 0.95,
    distributionFeePct: 0.28,
    genreAffinities: { Animation: 1.5, Drama: 1.2, "Sci-Fi": 1.25, Horror: 1.15 },
    talentPoolRegion: "JAPAN",
    localizationCostBase: 2000000,
  },
};

export const INDIAN_MARKETS = [
  CINEMA_MARKET_IDS.BOLLYWOOD,
  CINEMA_MARKET_IDS.TOLLYWOOD,
  CINEMA_MARKET_IDS.KOLLYWOOD,
];

export const getMarketList = () => Object.values(CINEMA_MARKETS);

export const getMarketById = (marketId) => CINEMA_MARKETS[marketId] || null;
