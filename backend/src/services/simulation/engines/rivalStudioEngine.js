// ---------------------------------------------------------------------------
// Rival Studio Engine
//
// Manages AI-controlled competitor studios. Integrates with aiEngine.js for
// autonomous, deterministic strategic decision-making.
// ---------------------------------------------------------------------------

import mongoose from "mongoose";
import { addNotification } from "../helpers/notificationHelper.js";
import { VERDICTS, getVerdict } from "../../../constants/verdicts.js";
import { addHistoricRecord } from "../helpers/historicRecordHelper.js";
import {
  AI_STRATEGIES,
  AI_STRATEGY_PROFILES,
  decideAndGreenlightMovie,
  processRivalFinancials,
} from "./aiEngine.js";

const PERSONALITIES = [
  AI_STRATEGIES.BLOCKBUSTER,
  AI_STRATEGIES.PRESTIGE,
  AI_STRATEGIES.INDIE,
  AI_STRATEGIES.COMMERCIAL,
  AI_STRATEGIES.FRANCHISE_FOCUSED,
  AI_STRATEGIES.CHAOTIC,
];

const STUDIO_NAMES = [
  "Apex Pictures",
  "Silver Screen Studios",
  "Nova Entertainment",
  "Zenith Films",
  "Eclipse Productions",
  "Titan Cinema",
  "Aurora Studios",
  "Paramount Visions",
  "Stellar Works",
  "Iron Gate Films",
];

const MOVIE_START_CHANCE = {
  [AI_STRATEGIES.BLOCKBUSTER]: 0.2,
  [AI_STRATEGIES.PRESTIGE]: 0.12,
  [AI_STRATEGIES.INDIE]: 0.28,
  [AI_STRATEGIES.COMMERCIAL]: 0.22,
  [AI_STRATEGIES.FRANCHISE_FOCUSED]: 0.25,
  [AI_STRATEGIES.CHAOTIC]: 0.3,
};

const MAX_ACTIVE_MOVIES = 3;

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const uid = () => Math.random().toString(36).slice(2, 10);

// ---------------------------------------------------------------------------
// 1. Generate rival studios (called once per game)
// ---------------------------------------------------------------------------

export const generateRivalStudios = (gameState) => {
  if (gameState.rivalStudiosInitialized) return;

  const count = 4;
  const usedNames = new Set();
  const shuffledNames = [...STUDIO_NAMES].sort(() => Math.random() - 0.5);

  const rivals = [];

  for (let i = 0; i < count; i++) {
    const personality = PERSONALITIES[i % PERSONALITIES.length];
    const name = shuffledNames.find((n) => !usedNames.has(n)) || `Rival Studio ${i + 1}`;
    usedNames.add(name);

    const profile = AI_STRATEGY_PROFILES[personality] || AI_STRATEGY_PROFILES[AI_STRATEGIES.COMMERCIAL];
    const startMoney = rand(profile.budgetRange.min * 2, profile.budgetRange.max * 3);

    rivals.push({
      id: uid(),
      name,
      personality,
      money: startMoney,
      prestige: rand(10, 40),
      fans: rand(5000, 50000),
      level: 1,
      status: "ACTIVE",
      activeMovies: [],
      movieHistory: [],
      franchises: [],
      stats: {
        moviesReleased: 0,
        hits: 0,
        blockbusters: 0,
        flops: 0,
        totalRevenue: 0,
        totalFansEarned: 0,
      },
    });
  }

  gameState.rivalStudios = rivals;
  gameState.rivalStudiosInitialized = true;

  if (typeof gameState.markModified === "function") {
    gameState.markModified("rivalStudios");
    gameState.markModified("rivalStudiosInitialized");
  }

  addNotification(
    gameState,
    `🏢 The industry is alive! ${count} autonomous rival studios have entered the market.`
  );
};

// ---------------------------------------------------------------------------
// 2. Process rivals each week
// ---------------------------------------------------------------------------

export const processRivalStudios = (gameState) => {
  if (!gameState.rivalStudios || gameState.rivalStudios.length === 0) return [];

  const rivalReleases = [];

  for (const rival of gameState.rivalStudios) {
    processRivalFinancials(rival);

    // --- Tick active movies ---
    const stillActive = [];

    for (const movie of rival.activeMovies || []) {
      movie.weeksRemaining = Math.max(0, movie.weeksRemaining - 1);

      // Advance production phase
      const progress = 1 - movie.weeksRemaining / (movie.totalWeeks || 1);
      if (progress >= 0.75) movie.phase = "POST_PRODUCTION";
      else if (progress >= 0.25) movie.phase = "PRODUCTION";
      else movie.phase = "PRE_PRODUCTION";

      if (movie.weeksRemaining === 0) {
        const release = _releaseRivalMovie(rival, movie, gameState.currentWeek);
        rivalReleases.push({ rivalName: rival.name, ...release });

        const emoji =
          release.verdict === VERDICTS.BLOCKBUSTER ||
          release.verdict === VERDICTS.ALL_TIME_BLOCKBUSTER
            ? "💥"
            : release.verdict === VERDICTS.HIT
            ? "🎉"
            : release.verdict === "FLOP" || release.verdict === "DISASTER"
            ? "💸"
            : "🎬";

        addNotification(
          gameState,
          `${emoji} ${rival.name} released "${movie.title}" (${movie.genre}) — ${release.verdict}! Box office: ₹${release.boxOffice.toLocaleString()}`
        );
      } else {
        stillActive.push(movie);
      }
    }

    rival.activeMovies = stillActive;

    // --- Autonomous Movie Greenlighting ---
    if (rival.activeMovies.length < MAX_ACTIVE_MOVIES) {
      const startChance = MOVIE_START_CHANCE[rival.personality] || 0.2;
      if (Math.random() < startChance) {
        const newMovie = decideAndGreenlightMovie(rival, gameState);
        if (newMovie) {
          rival.activeMovies.push(newMovie);
        }
      }
    }
  }

  if (typeof gameState.markModified === "function") {
    gameState.markModified("rivalStudios");
  }

  return rivalReleases;
};

// ---------------------------------------------------------------------------
// Internal: release a rival movie and update rival stats & franchises
// ---------------------------------------------------------------------------

const _releaseRivalMovie = (rival, movie, currentWeek) => {
  const qualityFactor = (movie.quality || 50) / 100;
  const starPowerBonus = ((movie.starPower || 50) - 50) * 0.01;
  const marketingMultiplier = 1 + Math.min(0.5, (movie.marketingBudget || 0) / (movie.budget || 1000000) * 0.5);

  const multiplier = (2 + qualityFactor * 3 + starPowerBonus + (Math.random() - 0.25)) * marketingMultiplier;
  const boxOffice = Math.round(movie.budget * Math.max(0.1, multiplier));
  const totalCost = (movie.budget || 0) + (movie.marketingBudget || 0);
  const profit = boxOffice - totalCost;
  const roi = totalCost > 0 ? profit / totalCost : 0;
  const verdict = getVerdict(roi);

  const fanGain = Math.round((boxOffice / 1000) * qualityFactor);

  const prestigeGain =
    verdict === VERDICTS.ALL_TIME_BLOCKBUSTER
      ? rand(25, 40)
      : verdict === VERDICTS.BLOCKBUSTER
      ? rand(15, 25)
      : verdict === VERDICTS.HIT
      ? rand(8, 15)
      : verdict === VERDICTS.AVERAGE
      ? rand(2, 8)
      : verdict === VERDICTS.FLOP
      ? -rand(3, 8)
      : -rand(8, 15);

  rival.money = Math.max(0, rival.money + boxOffice);
  rival.fans = (rival.fans || 0) + fanGain;
  rival.prestige = Math.max(0, (rival.prestige || 0) + prestigeGain);

  const nextLevelFans = (rival.level || 1) * 80000;
  if (rival.fans >= nextLevelFans) {
    rival.level = (rival.level || 1) + 1;
  }

  rival.stats = rival.stats || {};
  rival.stats.moviesReleased = (rival.stats.moviesReleased || 0) + 1;
  rival.stats.totalRevenue = (rival.stats.totalRevenue || 0) + boxOffice;
  rival.stats.totalFansEarned = (rival.stats.totalFansEarned || 0) + fanGain;

  if (verdict === VERDICTS.HIT) rival.stats.hits = (rival.stats.hits || 0) + 1;
  if (
    verdict === VERDICTS.BLOCKBUSTER ||
    verdict === VERDICTS.ALL_TIME_BLOCKBUSTER
  ) {
    rival.stats.blockbusters = (rival.stats.blockbusters || 0) + 1;
  }
  if (verdict === VERDICTS.FLOP || verdict === VERDICTS.DISASTER) {
    rival.stats.flops = (rival.stats.flops || 0) + 1;
  }

  // Record franchise IP if the film was successful and not already a sequel
  if (
    (verdict === VERDICTS.HIT ||
      verdict === VERDICTS.BLOCKBUSTER ||
      verdict === VERDICTS.ALL_TIME_BLOCKBUSTER) &&
    !movie.isSequel
  ) {
    rival.franchises = rival.franchises || [];
    rival.franchises.push({
      name: movie.title,
      genre: movie.genre,
      sequelCount: 1,
      totalGross: boxOffice,
    });
  }

  // History (cap at 20 entries)
  const historyEntry = {
    id: uid(),
    title: movie.title,
    genre: movie.genre,
    budget: movie.budget,
    marketingBudget: movie.marketingBudget,
    boxOffice,
    profit,
    verdict,
    releaseWeek: currentWeek,
    isSequel: movie.isSequel || false,
    director: movie.director,
    leadActor: movie.leadActor,
  };

  rival.movieHistory = rival.movieHistory || [];
  rival.movieHistory.push(historyEntry);
  if (rival.movieHistory.length > 20) rival.movieHistory.shift();

  // Add to historic records if database is connected
  if (mongoose.connection?.readyState === 1) {
    const rivalOpeningWeekend = Math.round(boxOffice * (0.3 + Math.random() * 0.1));
    addHistoricRecord({
      title: movie.title,
      studioId: rival.id,
      studioName: rival.name,
      worldwideGross: boxOffice,
      openingWeekend: rivalOpeningWeekend,
      roi,
      releaseWeek: currentWeek,
      isRival: true,
    }).catch((recordErr) => {
      console.error("Failed to save historic record for rival:", recordErr.message);
    });
  }

  return { boxOffice, profit, verdict, title: movie.title, genre: movie.genre };
};

// ---------------------------------------------------------------------------
// 3. Market-share penalty
// ---------------------------------------------------------------------------

const PRESSURE_STRENGTH = 0.45;
const MIN_MULTIPLIER = 0.6;

export const computeMarketSharePenalty = (gameState, playerFans = 0) => {
  if (!gameState.rivalStudios || gameState.rivalStudios.length === 0) return 1.0;

  const totalRivalFans = gameState.rivalStudios.reduce(
    (sum, r) => sum + (r.fans || 0),
    0
  );

  const totalMarketFans = playerFans + totalRivalFans;
  if (totalMarketFans === 0) return 1.0;

  const playerShare = playerFans / totalMarketFans;
  const pressure = 1 - playerShare;
  const penalty = Math.max(MIN_MULTIPLIER, 1 - pressure * PRESSURE_STRENGTH);

  return penalty;
};
