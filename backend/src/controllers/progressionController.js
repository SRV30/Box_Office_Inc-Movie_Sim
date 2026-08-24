import Progression from "../models/Progression.js";
import GameState from "../models/GameState.js";
import Studio from "../models/Studio.js";
import { ALL_ACHIEVEMENTS } from "../services/progression/achievementDefinitions.js";
import {
  checkAndUnlockAchievements,
  generateEndgameReport,
} from "../services/progression/achievementEngine.js";
import logger from "../utils/logger.js";

/**
 * GET /api/progression/achievements
 * Fetches all achievements, their unlock status, and current progress.
 */
export const getAchievements = async (req, res) => {
  try {
    const userId = req.user._id;
    let progression = await Progression.findOne({ userId });

    const gameState = await GameState.findOne({ user: userId });
    const studio = await Studio.findOne({ user: userId });

    if (gameState && studio) {
      await checkAndUnlockAchievements(gameState, studio, userId);
      progression = await Progression.findOne({ userId });
    }

    const achievementsList = ALL_ACHIEVEMENTS.map((def) => {
      const saved = progression?.achievements?.find((a) => a.id === def.id);
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        category: def.category,
        rarity: def.rarity,
        icon: def.icon,
        isUnlocked: saved?.isUnlocked || false,
        unlockedAtWeek: saved?.unlockedAtWeek || null,
        unlockedAtDate: saved?.unlockedAtDate || null,
        progress: saved?.progress || 0,
        maxProgress: def.maxProgress || 1,
      };
    });

    const unlockedCount = achievementsList.filter((a) => a.isUnlocked).length;

    return res.status(200).json({
      achievements: achievementsList,
      totalAchievements: achievementsList.length,
      unlockedCount,
      completionPercentage: Math.round((unlockedCount / achievementsList.length) * 100),
    });
  } catch (error) {
    logger.error("getAchievements error", { error: error.message });
    return res.status(500).json({ message: "Failed to fetch achievements" });
  }
};

/**
 * GET /api/progression/hall-of-fame
 * Retrieves inducted legendary movies, talents, and studio milestones.
 */
export const getHallOfFame = async (req, res) => {
  try {
    const userId = req.user._id;
    const progression = await Progression.findOne({ userId });
    const gameState = await GameState.findOne({ user: userId });

    const inductedTalent = (gameState?.retiredActors || [])
      .filter((a) => a.isLegacy)
      .map((a) => ({
        id: a.id,
        type: "TALENT",
        name: a.name,
        title: "Living Legend Performer",
        achievementSummary: `Starred in ${a.movies || 0} films (${a.hitMovies || 0} hits) with ₹${Number(a.boxOfficeTotal || 0).toLocaleString()} in box office and ${a.awards || 0} awards.`,
        inductedAtWeek: a.retiredAtWeek || 52,
        stats: {
          movies: a.movies,
          hits: a.hitMovies,
          awards: a.awards,
          boxOfficeTotal: a.boxOfficeTotal,
        },
      }));

    const persistedHoF = progression?.hallOfFame || [];
    const allEntries = [...persistedHoF, ...inductedTalent];

    return res.status(200).json({
      hallOfFame: allEntries,
      count: allEntries.length,
    });
  } catch (error) {
    logger.error("getHallOfFame error", { error: error.message });
    return res.status(500).json({ message: "Failed to fetch Hall of Fame" });
  }
};

/**
 * GET /api/progression/endgame-report
 * Generates and returns a comprehensive studio legacy endgame evaluation.
 */
export const getEndgameReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const gameState = await GameState.findOne({ user: userId });
    const studio = await Studio.findOne({ user: userId });

    if (!gameState || !studio) {
      return res.status(404).json({ message: "Game state or studio not found" });
    }

    const report = generateEndgameReport(gameState, studio);

    return res.status(200).json({ report });
  } catch (error) {
    logger.error("getEndgameReport error", { error: error.message });
    return res.status(500).json({ message: "Failed to generate endgame report" });
  }
};
