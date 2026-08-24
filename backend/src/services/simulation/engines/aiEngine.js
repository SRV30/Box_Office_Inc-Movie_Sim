/**
 * @fileoverview Autonomous Rival Studio AI Engine
 *
 * Implements sophisticated, deterministic AI decision-making for rival studios:
 *  - Strategic Studio Personalities (Blockbuster, Prestige, Indie, Commercial, Franchise, Chaotic)
 *  - Budget allocation & liquidity constraints
 *  - Trend & market climate responsiveness (Boom vs Fatigue exploitation)
 *  - Talent package scouting & assignment (Directors, Lead Actors)
 *  - Script greenlighting & Franchise / Sequel generation
 *  - Intelligent release calendar scheduling & competitive clash avoidance
 *  - Studio growth, financial distress, and restructuring mechanics
 *
 * Implements Issue #522: Build autonomous rival studio AI simulation.
 */

import { VERDICTS, getVerdict } from "../../../constants/verdicts.js";

export const AI_STRATEGIES = {
  BLOCKBUSTER: "BLOCKBUSTER",
  PRESTIGE: "PRESTIGE",
  INDIE: "INDIE",
  COMMERCIAL: "COMMERCIAL",
  FRANCHISE_FOCUSED: "FRANCHISE_FOCUSED",
  CHAOTIC: "CHAOTIC",
};

export const AI_STRATEGY_PROFILES = {
  [AI_STRATEGIES.BLOCKBUSTER]: {
    name: "Blockbuster Titan",
    description: "High-budget spectacles, aggressive marketing, and star-studded casts.",
    genres: ["Action", "Sci-Fi", "Adventure", "Thriller"],
    budgetRange: { min: 4000000, max: 15000000 },
    marketingShare: 0.35,
    qualityRange: { min: 55, max: 92 },
    talentPriority: "STAR_POWER",
    riskTolerance: "MODERATE",
    releasePatience: 20,
    franchiseLikelihood: 0.6,
  },
  [AI_STRATEGIES.PRESTIGE]: {
    name: "Prestige Auteur",
    description: "Award-seeking cinematic masterpieces, top director vision, and high quality floors.",
    genres: ["Drama", "Thriller", "Biography", "Historical"],
    budgetRange: { min: 1800000, max: 6000000 },
    marketingShare: 0.2,
    qualityRange: { min: 70, max: 98 },
    talentPriority: "DIRECTOR_SKILL",
    riskTolerance: "LOW",
    releasePatience: 24,
    franchiseLikelihood: 0.15,
  },
  [AI_STRATEGIES.INDIE]: {
    name: "Indie Innovator",
    description: "Low-budget agile productions with rapid turnaround and high ROI margins.",
    genres: ["Drama", "Comedy", "Romance", "Horror", "Mystery"],
    budgetRange: { min: 400000, max: 1800000 },
    marketingShare: 0.15,
    qualityRange: { min: 45, max: 88 },
    talentPriority: "COST_EFFICIENCY",
    riskTolerance: "HIGH",
    releasePatience: 10,
    franchiseLikelihood: 0.25,
  },
  [AI_STRATEGIES.COMMERCIAL]: {
    name: "Commercial Studio",
    description: "Broad-appeal family, comedy, and animated hits calibrated to market trends.",
    genres: ["Comedy", "Romance", "Family", "Animation"],
    budgetRange: { min: 1200000, max: 7000000 },
    marketingShare: 0.25,
    qualityRange: { min: 45, max: 82 },
    talentPriority: "BALANCED",
    riskTolerance: "LOW",
    releasePatience: 14,
    franchiseLikelihood: 0.45,
  },
  [AI_STRATEGIES.FRANCHISE_FOCUSED]: {
    name: "Universe Builder",
    description: "Heavily capitalizes on sequels, spin-offs, and expanding intellectual properties.",
    genres: ["Action", "Sci-Fi", "Fantasy", "Adventure"],
    budgetRange: { min: 3500000, max: 13000000 },
    marketingShare: 0.3,
    qualityRange: { min: 58, max: 90 },
    talentPriority: "CONSISTENCY",
    riskTolerance: "MODERATE",
    releasePatience: 18,
    franchiseLikelihood: 0.85,
  },
  [AI_STRATEGIES.CHAOTIC]: {
    name: "Disruptor Wildcard",
    description: "Unpredictable budget swings, erratic genre experiments, and high volatility.",
    genres: ["Action", "Horror", "Sci-Fi", "Comedy", "Drama", "Romance", "Thriller"],
    budgetRange: { min: 250000, max: 12000000 },
    marketingShare: 0.25,
    qualityRange: { min: 25, max: 96 },
    talentPriority: "RANDOM",
    riskTolerance: "EXTREME",
    releasePatience: 12,
    franchiseLikelihood: 0.4,
  },
};

const TITLE_PREFIXES = [
  "The Last", "Dark", "Rising", "Eternal", "Shadow of", "Beyond the",
  "Empire of", "Dawn of", "Fury of", "Legend of", "Edge of", "Return of",
  "Fall of", "Kingdom of", "Phantom", "Secret", "Hidden", "Lost",
  "Chronicles of", "The Great", "Battle of", "Echoes of",
];

const TITLE_NOUNS = [
  "Storm", "Kingdom", "Empire", "Dawn", "Horizon", "Thunder",
  "Legacy", "Prophecy", "Destiny", "Silence", "Fire", "Star",
  "Warrior", "Ghost", "Champion", "Echo", "Sentinel", "Abyss",
  "Phoenix", "Titan", "Shadow", "Aurora", "Reckoning", "Fallen",
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Evaluates active market trends and picks the most advantageous genre for an AI studio.
 *
 * @param {object} rival - Rival studio state.
 * @param {object} gameState - GameState with active market trends.
 * @returns {string} Selected genre.
 */
export const selectOptimalGenre = (rival, gameState = {}) => {
  const personality = rival.personality || AI_STRATEGIES.COMMERCIAL;
  const profile = AI_STRATEGY_PROFILES[personality] || AI_STRATEGY_PROFILES[AI_STRATEGIES.COMMERCIAL];
  const candidateGenres = [...profile.genres];

  const activeTrends = gameState?.marketTrends?.activeTrends || [];
  const boomingGenres = activeTrends
    .filter((t) => t.type === "BOOM")
    .map((t) => t.genre);
  const fatiguedGenres = activeTrends
    .filter((t) => t.type === "FATIGUE")
    .map((t) => t.genre);

  // If a booming genre matches the studio profile, prioritize it heavily
  const matchingBoom = candidateGenres.find((g) => boomingGenres.includes(g));
  if (matchingBoom && Math.random() < 0.75) {
    return matchingBoom;
  }

  // Filter out fatigued genres unless studio is chaotic
  let eligible = candidateGenres;
  if (personality !== AI_STRATEGIES.CHAOTIC) {
    eligible = candidateGenres.filter((g) => !fatiguedGenres.includes(g));
    if (eligible.length === 0) eligible = candidateGenres;
  }

  return pick(eligible);
};

/**
 * Generates an autonomous movie title, checking for franchise sequel opportunities.
 *
 * @param {object} rival - Rival studio state.
 * @param {string} genre - Selected genre.
 * @returns {{ title: string, isSequel: boolean, franchiseName: string|null, sequelNumber: number }}
 */
export const generateMovieConcept = (rival, genre) => {
  const personality = rival.personality || AI_STRATEGIES.COMMERCIAL;
  const profile = AI_STRATEGY_PROFILES[personality] || AI_STRATEGY_PROFILES[AI_STRATEGIES.COMMERCIAL];

  rival.franchises = rival.franchises || [];

  // Check if we should produce a franchise sequel
  if (rival.franchises.length > 0 && Math.random() < profile.franchiseLikelihood) {
    const existingFranchise = pick(rival.franchises);
    existingFranchise.sequelCount = (existingFranchise.sequelCount || 1) + 1;
    const romanNumerals = ["II", "III", "IV", "V", "VI", "VII"];
    const numeral = romanNumerals[existingFranchise.sequelCount - 2] || `${existingFranchise.sequelCount}`;
    return {
      title: `${existingFranchise.name} ${numeral}`,
      isSequel: true,
      franchiseName: existingFranchise.name,
      sequelNumber: existingFranchise.sequelCount,
    };
  }

  const baseTitle = `${pick(TITLE_PREFIXES)} ${pick(TITLE_NOUNS)}`;
  return {
    title: baseTitle,
    isSequel: false,
    franchiseName: null,
    sequelNumber: 1,
  };
};

/**
 * Selects or generates an appropriate autonomous talent package for a rival production.
 *
 * @param {object} rival - Rival studio state.
 * @param {number} budget - Production budget.
 * @returns {{ directorName: string, directorSkill: number, leadActorName: string, starPower: number }}
 */
export const scoutTalentPackage = (rival, budget) => {
  const personality = rival.personality || AI_STRATEGIES.COMMERCIAL;
  const scale = Math.min(1.0, budget / 10000000);

  let directorSkill = Math.min(99, Math.round(50 + scale * 40 + rand(-5, 10)));
  let starPower = Math.min(99, Math.round(45 + scale * 45 + rand(-5, 10)));

  if (personality === AI_STRATEGIES.PRESTIGE) {
    directorSkill = Math.min(99, directorSkill + 10);
  } else if (personality === AI_STRATEGIES.BLOCKBUSTER) {
    starPower = Math.min(99, starPower + 12);
  }

  const firstNames = ["James", "Christopher", "Sophia", "Aarav", "Elena", "Marcus", "Priya", "Lucas", "Maya", "Daniel"];
  const lastNames = ["Cameron", "Nolan", "Kapoor", "Vance", "Sharma", "Rodriguez", "Patel", "Foster", "Sterling", "Zhao"];

  return {
    directorName: `${pick(firstNames)} ${pick(lastNames)}`,
    directorSkill,
    leadActorName: `${pick(firstNames)} ${pick(lastNames)}`,
    starPower,
  };
};

/**
 * Calculates optimal release week to minimize clash penalties while respecting production timeline.
 *
 * @param {number} currentWeek - Current simulation week.
 * @param {number} productionDuration - Total weeks in production pipeline.
 * @param {object} gameState - GameState with scheduled release calendar.
 * @returns {number} Scheduled release week.
 */
export const scheduleOptimalRelease = (currentWeek, productionDuration, gameState = {}) => {
  const targetWeek = currentWeek + productionDuration;

  // Search in a window of targetWeek .. targetWeek + 3 for least crowded slot
  const scheduledPlayerReleases = (gameState.activeMovies || [])
    .filter((m) => m.scheduledReleaseWeek)
    .map((m) => m.scheduledReleaseWeek);

  let bestWeek = targetWeek;
  let minClashes = 999;

  for (let offset = 0; offset <= 3; offset += 1) {
    const candidateWeek = targetWeek + offset;
    const clashCount = scheduledPlayerReleases.filter((w) => w === candidateWeek).length;
    if (clashCount < minClashes) {
      minClashes = clashCount;
      bestWeek = candidateWeek;
    }
  }

  return bestWeek;
};

/**
 * Decision maker: Greenlights an autonomous movie production for a rival studio.
 *
 * @param {object} rival - Rival studio state.
 * @param {object} gameState - Current game state.
 * @returns {object|null} New movie project or null if constrained.
 */
export const decideAndGreenlightMovie = (rival, gameState = {}) => {
  const personality = rival.personality || AI_STRATEGIES.COMMERCIAL;
  const profile = AI_STRATEGY_PROFILES[personality] || AI_STRATEGY_PROFILES[AI_STRATEGIES.COMMERCIAL];
  const currentWeek = Number(gameState.currentWeek || 1);

  // Check financial health
  const money = Number(rival.money || 0);
  const minBudget = profile.budgetRange.min;

  if (money < minBudget * 0.5) {
    // Financial distress: cannot greenlight
    rival.status = "FINANCIAL_DISTRESS";
    return null;
  }

  // Budget calculation based on wealth and personality
  const budgetCap = Math.min(money * 0.6, profile.budgetRange.max);
  const budget = Math.max(minBudget, rand(minBudget, Math.max(minBudget, budgetCap)));
  const marketingBudget = Math.round(budget * profile.marketingShare);
  const totalCost = budget + marketingBudget;

  if (money < totalCost) {
    return null;
  }

  // Deduct production & marketing funds
  rival.money = Math.max(0, money - totalCost);

  const genre = selectOptimalGenre(rival, gameState);
  const concept = generateMovieConcept(rival, genre);
  const talent = scoutTalentPackage(rival, budget);

  // Quality calculation incorporating director skill, budget wealth, and sequel synergy
  const baseQuality = rand(profile.qualityRange.min, profile.qualityRange.max);
  const talentBonus = Math.round((talent.directorSkill - 50) * 0.2 + (talent.starPower - 50) * 0.15);
  const sequelBonus = concept.isSequel ? 6 : 0;
  const quality = Math.max(10, Math.min(100, baseQuality + talentBonus + sequelBonus));

  const totalWeeks = profile.releasePatience + rand(-2, 4);
  const scheduledReleaseWeek = scheduleOptimalRelease(currentWeek, totalWeeks, gameState);

  return {
    id: uid(),
    title: concept.title,
    genre,
    budget,
    marketingBudget,
    quality,
    totalWeeks,
    weeksRemaining: totalWeeks,
    scheduledReleaseWeek,
    director: talent.directorName,
    directorSkill: talent.directorSkill,
    leadActor: talent.leadActorName,
    starPower: talent.starPower,
    isSequel: concept.isSequel,
    franchiseName: concept.franchiseName,
    sequelNumber: concept.sequelNumber,
    phase: "PRE_PRODUCTION",
  };
};

/**
 * Evaluates rival studio financial state and triggers turnaround / restructuring if needed.
 *
 * @param {object} rival - Rival studio state.
 */
export const processRivalFinancials = (rival) => {
  const money = Number(rival.money || 0);

  if (money <= 500000) {
    rival.status = "BANKRUPTCY_RISK";
    // Emergency bailout / private equity restructuring after repeated distress
    if (money <= 100000 && Math.random() < 0.2) {
      const emergencyInjection = 2500000;
      rival.money += emergencyInjection;
      rival.prestige = Math.max(0, (rival.prestige || 0) - 10);
      rival.status = "RESTRUCTURED";
    }
  } else {
    rival.status = "ACTIVE";
  }
};
