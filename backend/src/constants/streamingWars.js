/**
 * OTT platform and streaming wars constants (issue #546).
 */

export const OTT_PLATFORMS = {
  FLIXSTREAM: {
    id: "flixstream",
    name: "FlixStream",
    isPlayerPlatform: true,
    contentBudget: 1000000000,
    subscribers: 50000000,
    prestige: 80,
    bidAggression: 1.0,
    churnRate: 0.002,
  },
  PRIMESCREEN: {
    id: "primescreen",
    name: "PrimeScreen",
    isPlayerPlatform: false,
    contentBudget: 2000000000,
    subscribers: 40000000,
    prestige: 75,
    bidAggression: 1.15,
    churnRate: 0.0018,
  },
  CINEMAX: {
    id: "cinemax",
    name: "CineMax+",
    isPlayerPlatform: false,
    contentBudget: 500000000,
    subscribers: 20000000,
    prestige: 55,
    bidAggression: 0.85,
    churnRate: 0.0025,
  },
  NETCINEMA: {
    id: "netcinema",
    name: "NetCinema",
    isPlayerPlatform: false,
    contentBudget: 1500000000,
    subscribers: 45000000,
    prestige: 85,
    bidAggression: 1.25,
    churnRate: 0.0015,
  },
  STREAMMAX: {
    id: "streammax",
    name: "StreamMax",
    isPlayerPlatform: false,
    contentBudget: 800000000,
    subscribers: 30000000,
    prestige: 65,
    bidAggression: 1.05,
    churnRate: 0.002,
  },
};

export const EXCLUSIVITY_WINDOWS = {
  EXCLUSIVE_DAY_DATE: { label: "Exclusive Day & Date", weeks: 12, valueMultiplier: 2.0 },
  POST_THEATRICAL_SVOD: { label: "Post-Theatrical SVOD", weeks: 52, valueMultiplier: 1.0 },
  GLOBAL_PREMIERE: { label: "Global Premiere", weeks: 26, valueMultiplier: 1.5 },
};

export const getOTTPlatformList = () => Object.values(OTT_PLATFORMS);

export const getOTTPlatform = (platformId) =>
  Object.values(OTT_PLATFORMS).find((p) => p.id === platformId) || null;
