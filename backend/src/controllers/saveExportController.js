import GameState from "../models/GameState.js";
import Studio from "../models/Studio.js";
import Movie from "../models/Movie.js";
import Franchise from "../models/Franchise.js";
import Notification from "../models/Notification.js";
import { withTransaction } from "../utils/financeTransactionHelper.js";

const BACKUP_SCHEMA_VERSION = "1.0.0";

/**
 * Export player's complete studio game state
 * GET /api/save/export
 */
export const exportSave = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [gameState, studio, movies, franchises, notifications] = await Promise.all([
      GameState.findOne({ user: userId }).lean(),
      Studio.findOne({ owner: userId }).lean(),
      Movie.find({ studioId: req.user.studio || undefined }).lean(),
      Franchise.find({ studioId: req.user.studio || undefined }).lean(),
      Notification.find({ gameStateId: gameState?._id }).sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    if (!gameState || !studio) {
      return res.status(404).json({ success: false, message: "Game state or studio not found" });
    }

    const payload = {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      account: {
        userId: userId.toString(),
        username: req.user.username,
      },
      data: {
        studio: {
          name: studio.name,
          money: studio.money,
          prestige: studio.prestige,
          fans: studio.fans,
          financialHistory: studio.financialHistory || [],
        },
        gameState: {
          currentWeek: gameState.currentWeek,
          ownedScripts: gameState.ownedScripts || [],
          ownedDirectors: gameState.ownedDirectors || [],
          ownedActors: gameState.ownedActors || [],
          ownedCrewTeams: gameState.ownedCrewTeams || [],
          marketTrends: gameState.marketTrends || {},
        },
        moviesCount: movies.length,
        franchisesCount: franchises.length,
      },
    };

    return res.status(200).json({ success: true, backup: payload });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore player's studio game state
 * POST /api/save/restore
 */
export const restoreSave = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { backup } = req.body;

    if (!backup || !backup.schemaVersion || !backup.data) {
      return res.status(400).json({ success: false, message: "Invalid backup format or missing schemaVersion" });
    }

    if (backup.schemaVersion !== BACKUP_SCHEMA_VERSION) {
      return res.status(400).json({
        success: false,
        message: `Incompatible backup schema version: ${backup.schemaVersion}. Expected ${BACKUP_SCHEMA_VERSION}`,
      });
    }

    // Never allow a backup exported by user A to restore into user B
    if (backup.account?.userId && backup.account.userId !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Backup belongs to a different player account and cannot be restored",
      });
    }

    const { studio: studioData, gameState: gameData } = backup.data;
    if (!studioData || !gameData) {
      return res.status(400).json({ success: false, message: "Corrupted backup data payload" });
    }

    await withTransaction(async (session) => {
      const studio = await Studio.findOne({ owner: userId }).session(session);
      const gameState = await GameState.findOne({ user: userId }).session(session);

      if (!studio || !gameState) {
        throw new Error("Active player studio or game state not found");
      }

      studio.name = studioData.name || studio.name;
      studio.money = typeof studioData.money === "number" ? studioData.money : studio.money;
      studio.prestige = typeof studioData.prestige === "number" ? studioData.prestige : studio.prestige;
      studio.fans = typeof studioData.fans === "number" ? studioData.fans : studio.fans;
      if (Array.isArray(studioData.financialHistory)) {
        studio.financialHistory = studioData.financialHistory;
      }
      await studio.save({ session });

      gameState.currentWeek = typeof gameData.currentWeek === "number" ? gameData.currentWeek : gameState.currentWeek;
      if (Array.isArray(gameData.ownedScripts)) gameState.ownedScripts = gameData.ownedScripts;
      if (Array.isArray(gameData.ownedDirectors)) gameState.ownedDirectors = gameData.ownedDirectors;
      if (Array.isArray(gameData.ownedActors)) gameState.ownedActors = gameData.ownedActors;
      if (Array.isArray(gameData.ownedCrewTeams)) gameState.ownedCrewTeams = gameData.ownedCrewTeams;
      if (gameData.marketTrends) gameState.marketTrends = gameData.marketTrends;

      await gameState.save({ session });
    });

    return res.status(200).json({
      success: true,
      message: "Player save restored successfully",
    });
  } catch (error) {
    next(error);
  }
};
