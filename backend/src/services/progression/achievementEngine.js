/**
 * @fileoverview Endgame Progression, Achievements & Hall of Fame Engine
 *
 * Implements data-driven achievement evaluation, duplicate prevention,
 * Hall of Fame inductions, and endgame career report generation.
 */

import Progression from "../../models/Progression.js";
import { ALL_ACHIEVEMENTS } from "./achievementDefinitions.js";
import { addNotification } from "../simulation/helpers/notificationHelper.js";

/**
 * Derives aggregate stats from GameState and Studio to evaluate achievements.
 *
 * @param {object} gameState - GameState document.
 * @param {object} studio - Studio document.
 * @returns {object} Aggregated stats dictionary.
 */
export const deriveSimulationStats = (gameState = {}, studio = {}) => {
  const activeMovies = gameState.activeMovies || [];
  const releasedMovies = activeMovies.filter(
    (m) => m.status === "RELEASED" || m.status === "RELEASED_STREAMING"
  );

  let hitMovies = 0;
  let blockbusters = 0;
  let allTimeBlockbusters = 0;
  let totalBoxOffice = Number(studio.totalRevenue || 0);

  releasedMovies.forEach((m) => {
    if (m.verdict === "HIT") hitMovies += 1;
    if (m.verdict === "BLOCKBUSTER") blockbusters += 1;
    if (m.verdict === "ALL_TIME_BLOCKBUSTER") allTimeBlockbusters += 1;
  });

  const legacyTalentCount = (gameState.retiredActors || []).filter(
    (a) => a.isLegacy || a.careerStage === "LEGACY"
  ).length;

  let maxFranchiseInstallments = 0;
  (gameState.franchises || []).forEach((f) => {
    if ((f.movieIds?.length || 0) > maxFranchiseInstallments) {
      maxFranchiseInstallments = f.movieIds.length;
    }
  });

  return {
    moviesReleased: releasedMovies.length,
    hitMovies,
    blockbusters,
    allTimeBlockbusters,
    totalBoxOffice,
    totalAwards: gameState.awardsWon || studio.prestige ? Math.floor(studio.prestige / 30) : 0,
    maxFranchiseInstallments,
    legacyTalentCount,
    currentWeek: Number(gameState.currentWeek || 1),
    recoveredFromCrisis: Number(studio.money || 0) > 2000000 && Number(studio.prestige || 0) > 50,
  };
};

/**
 * Checks all achievement conditions against the current simulation state,
 * records newly unlocked achievements, and prevents duplicate unlocks.
 *
 * @param {object} gameState - GameState document.
 * @param {object} studio - Studio document.
 * @param {string|object} userId - User ID.
 * @returns {Promise<Array<object>>} List of newly unlocked achievements this run.
 */
export const checkAndUnlockAchievements = async (gameState, studio, userId) => {
  if (!userId) return [];

  const stats = deriveSimulationStats(gameState, studio);

  let progressionDoc = null;
  if (Progression.db?.readyState === 1) {
    progressionDoc = await Progression.findOne({ userId });
    if (!progressionDoc) {
      progressionDoc = new Progression({
        userId,
        achievements: ALL_ACHIEVEMENTS.map((def) => ({
          id: def.id,
          name: def.name,
          description: def.description,
          category: def.category,
          rarity: def.rarity,
          icon: def.icon,
          isUnlocked: false,
          progress: 0,
          maxProgress: def.maxProgress || 1,
        })),
        hallOfFame: [],
      });
      await progressionDoc.save();
    }
  }

  const existingMap = new Map();
  if (progressionDoc) {
    (progressionDoc.achievements || []).forEach((ach) => existingMap.set(ach.id, ach));
  }

  const newlyUnlocked = [];

  for (const def of ALL_ACHIEVEMENTS) {
    const existing = existingMap.get(def.id);
    if (existing?.isUnlocked) {
      continue; // Prevent duplicate unlock
    }

    const currentProgress = def.getProgress ? def.getProgress(stats) : stats.moviesReleased || 0;
    const isMet = def.check(stats);

    if (existing) {
      existing.progress = currentProgress;
    }

    if (isMet) {
      if (existing) {
        existing.isUnlocked = true;
        existing.unlockedAtWeek = gameState.currentWeek;
        existing.unlockedAtDate = new Date();
        existing.progress = existing.maxProgress;
      }
      newlyUnlocked.push(def);

      addNotification(
        gameState,
        `🏆 Achievement Unlocked: [${def.name}] — ${def.description}`
      );
    }
  }

  if (progressionDoc && newlyUnlocked.length > 0) {
    await progressionDoc.save();
  }

  return newlyUnlocked;
};

/**
 * Inducts exceptional movies or legendary talent into the Hall of Fame.
 *
 * @param {string|object} userId - User ID.
 * @param {object} entry - Entry data { type, name, title, achievementSummary, inductedAtWeek, stats }.
 * @returns {Promise<object|null>} Saved Hall of Fame entry.
 */
export const inductIntoHallOfFame = async (userId, entry) => {
  if (!userId || !entry) return null;
  if (Progression.db?.readyState !== 1) return entry;

  let progressionDoc = await Progression.findOne({ userId });
  if (!progressionDoc) {
    progressionDoc = new Progression({ userId, achievements: [], hallOfFame: [] });
  }

  const alreadyInducted = progressionDoc.hallOfFame.some(
    (h) => h.id === entry.id || (h.name === entry.name && h.type === entry.type)
  );

  if (!alreadyInducted) {
    progressionDoc.hallOfFame.push({
      ...entry,
      inductedAtWeek: entry.inductedAtWeek || 1,
    });
    await progressionDoc.save();
  }

  return entry;
};

/**
 * Generates comprehensive endgame studio evaluation & historical retrospective.
 *
 * @param {object} gameState - GameState document.
 * @param {object} studio - Studio document.
 * @returns {object} Endgame report data.
 */
export const generateEndgameReport = (gameState = {}, studio = {}) => {
  const currentWeek = Number(gameState.currentWeek || 1);
  const yearsSimulated = (currentWeek / 52).toFixed(1);
  const totalRevenue = Number(studio.totalRevenue || 0);
  const prestige = Number(studio.prestige || 0);
  const fans = Number(studio.fans || 0);

  const activeMovies = gameState.activeMovies || [];
  const releasedMovies = activeMovies.filter(
    (m) => m.status === "RELEASED" || m.status === "RELEASED_STREAMING"
  );

  let blockbusters = 0;
  let hits = 0;
  let flops = 0;
  let topGrossingMovie = null;

  releasedMovies.forEach((m) => {
    if (m.verdict === "BLOCKBUSTER" || m.verdict === "ALL_TIME_BLOCKBUSTER") {
      blockbusters += 1;
    }
    if (m.verdict === "HIT") hits += 1;
    if (m.verdict === "FLOP" || m.verdict === "DISASTER") flops += 1;

    const gross = Number(m.boxOffice?.worldwideGross || m.worldwideGross || 0);
    if (!topGrossingMovie || gross > topGrossingMovie.gross) {
      topGrossingMovie = {
        title: m.title,
        gross,
        verdict: m.verdict,
        quality: m.quality,
      };
    }
  });

  // Calculate composite Studio Legacy Rating (0 - 1000)
  const legacyScore = Math.round(
    Math.min(300, (totalRevenue / 1000000000) * 300) +
      Math.min(300, prestige * 3) +
      Math.min(200, blockbusters * 40 + hits * 15) +
      Math.min(200, (Number(yearsSimulated) / 20) * 200)
  );

  let rankTitle = "Independent Contender";
  if (legacyScore >= 850) rankTitle = "Eternal Golden Empire";
  else if (legacyScore >= 700) rankTitle = "Major Hollywood Titan";
  else if (legacyScore >= 500) rankTitle = "Acclaimed Production Powerhouse";
  else if (legacyScore >= 300) rankTitle = "Established Mid-Major Studio";

  return {
    studioName: studio.name || "My Studio",
    yearsSimulated,
    totalWeeks: currentWeek,
    legacyScore,
    rankTitle,
    financialSummary: {
      totalLifetimeGross: totalRevenue,
      currentBalance: Number(studio.money || 0),
      prestigeScore: prestige,
      fanbaseTotal: fans,
    },
    catalogStats: {
      moviesReleased: releasedMovies.length,
      blockbusters,
      hits,
      flops,
      topGrossingMovie: topGrossingMovie || { title: "None", gross: 0 },
    },
    hallOfFameCount: (gameState.retiredActors || []).filter((a) => a.isLegacy).length,
    generatedAt: new Date().toISOString(),
  };
};
