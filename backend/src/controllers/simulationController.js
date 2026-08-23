import GameState from "../models/GameState.js";
import Studio from "../models/Studio.js";
import { runWeeklySimulation } from "../services/simulation/runWeeklySimulation.js";
import Notification from "../models/Notification.js";
import TalentHistory from "../models/TalentHistory.js";
import Movie from "../models/Movie.js";
import Franchise from "../models/Franchise.js";
import NewsItem from "../models/NewsItem.js";
import TVShow from "../models/TVShowModel.js";
import StudioUpgrade from "../models/StudioUpgrade.js";
import MarketDirector from "../models/MarketDirector.js";
import MarketActor from "../models/MarketActor.js";
import MarketCrewTeam from "../models/MarketCrewTeam.js";
import PastAward from "../models/PastAward.js";
import { generateDirectors } from "../services/director/directorGenerator.js";
import { generateActors } from "../services/actor/actorGenerator.js";
import { generateCrewTeams } from "../services/crew/crewGenerator.js";

import { withTransaction } from "../utils/financeTransactionHelper.js";
import logger from "../utils/logger.js";

export const simulateWeek = async (req, res) => {
  try {
    const { weeks = 1 } = req.body;
    const parsedWeeks = parseInt(weeks, 10);

    if (isNaN(parsedWeeks) || parsedWeeks <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid input: numWeeks must be a positive number"
      });
    }

    const numWeeks = Math.min(52, parsedWeeks);

    // Accumulate notifications generated during the simulation ticks
    let newNotifications = [];
    let newHistories = [];

    // Accumulate rival releases across all simulated weeks
    const allRivalReleases = [];

    let gameState;
    let studio;
    let startWeek;
    let startFans;
    let startPrestige;

    await withTransaction(async (session) => {
      // Load the documents *inside* the transaction and bind them to the
      // session so the version this transaction commits is the version it
      // read. Loading them outside the session (as before) left a window
      // where another request could save the same Studio/GameState doc
      // in between, causing the transactional save at the end to fail
      // with a Mongoose VersionError against a now-stale in-memory copy.
      gameState = await GameState.findOne({ user: req.user._id }).session(session);
      studio = await Studio.findOne({ owner: req.user._id }).session(session);

      if (!gameState || !studio) {
        const notFoundError = new Error("Game state or studio not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
      }

      startWeek = gameState.currentWeek;
      startFans = studio.fans || 0;
      startPrestige = studio.prestige || 0;

      // Run simulation multiple times
      for (let i = 0; i < numWeeks; i++) {
        const expectedWeek = startWeek + i;
        if (gameState.currentWeek > expectedWeek) {
          // This week was already processed (e.g. due to server restart), skip it
          continue;
        }

        const prevMoney = studio.money || 0;
        const weekRivalReleases = await runWeeklySimulation(gameState, studio);
        gameState.lastSimulatedWeek = gameState.currentWeek;
        allRivalReleases.push(...(weekRivalReleases || []));

        // Financial History Logging
        studio.financialHistory = studio.financialHistory || [];
        studio.financialHistory.push({
            week: ((gameState.currentWeek - 2) % 52) + 1,
            year: Math.floor((gameState.currentWeek - 2) / 52) + 1,
            revenue: Math.max(0, studio.money - prevMoney),
            expenses: Math.max(0, prevMoney - studio.money),
            payroll: 0,
            movieCosts: 0,
            marketingCosts: 0,
            profit: studio.money - prevMoney,
            balance: studio.money
        });

        // Limit history size to 100 entries for performance
        if (studio.financialHistory.length > 100) {
            studio.financialHistory.shift();
        }

        if (gameState._pendingNotifications && gameState._pendingNotifications.length > 0) {
          newNotifications.push(...gameState._pendingNotifications);
          gameState._pendingNotifications = [];
        }
        if (gameState._pendingTalentHistories && gameState._pendingTalentHistories.length > 0) {
          newHistories.push(...gameState._pendingTalentHistories);
          gameState._pendingTalentHistories = [];
        }
      }

      if (newNotifications.length > 0) {
        const inserted = await Notification.insertMany(newNotifications, { session });
        newNotifications = inserted;
      }

      if (newHistories.length > 0) {
        await TalentHistory.insertMany(newHistories, { session });
      }

      await studio.save({ session });
      await gameState.save({ session });
    });

    const endFans = studio.fans || 0;
    const endPrestige = studio.prestige || 0;

    // Summary data — include rival releases for the frontend modal
    const summary = {
      weeksSimulated: numWeeks,
      startWeek,
      endWeek: gameState.currentWeek,
      fansGained: endFans - startFans,
      prestigeGained: endPrestige - startPrestige,
      notificationCount: newNotifications.length,
      newNotifications: newNotifications.slice(-10), // Last 10
      rivalReleases: allRivalReleases.slice(-8),      // Last 8 rival releases
    };

    res.status(200).json({
      message: `${numWeeks} week(s) simulated successfully`,
      currentWeek: gameState.currentWeek,
      summary
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
        logger.error("Simulation Transaction Error", { error: error.message });
    res.status(500).json({ success: false, message: `Operation rolled back due to: ${error.message}` });
  }
};

export const getPastAwards = async (req, res) => {
  try {
    const gameState = await GameState.findOne({ user: req.user._id });
    if (!gameState) {
      return res.status(404).json({ message: "Game state not found" });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [dbAwards, totalDbAwards] = await Promise.all([
      PastAward.find({ gameStateId: gameState._id })
        .sort({ year: -1 })
        .lean(),
      PastAward.countDocuments({ gameStateId: gameState._id }),
    ]);

    // Backward compatibility: If gameState contains legacy embedded pastAwards, merge them deduplicating by year
    const legacyAwards = Array.isArray(gameState.pastAwards) ? gameState.pastAwards : [];
    const awardsMap = new Map();

    for (const la of legacyAwards) {
      if (la && typeof la.year === "number") {
        awardsMap.set(la.year, {
          ...la,
          _id: la._id || `legacy-${la.year}`,
          gameStateId: gameState._id,
        });
      }
    }

    for (const da of dbAwards) {
      if (da && typeof da.year === "number") {
        awardsMap.set(da.year, da);
      }
    }

    const allAwards = Array.from(awardsMap.values()).sort((a, b) => b.year - a.year);
    const total = allAwards.length;
    const paginatedAwards = allAwards.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      awards: paginatedAwards,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching awards", { error: error.message });
    res.status(500).json({ message: "Failed to fetch awards" });
  }
};
export const getMarketIntelligence = async (req, res) => {
  try {
    const gameState = await GameState.findOne({ user: req.user._id });
    if (!gameState) {
      return res.status(404).json({ message: "Game state not found" });
    }

    res.status(200).json({
      success: true,
      currentWeek: gameState.currentWeek,
      marketTrends: gameState.marketTrends || { activeTrends: [] },
      randomEvents: gameState.randomEvents?.history?.slice(-10).reverse() || []
    });
  } catch (error) {
    logger.error("Error fetching market intelligence", { error: error.message });
    res.status(500).json({ message: "Failed to fetch market intelligence" });
  }
};

export const resetGame = async (req, res) => {
  try {
    let gameState;
    let studio;

    await withTransaction(async (session) => {
      gameState = await GameState.findOne({ user: req.user._id }).session(session);
      studio = await Studio.findOne({ owner: req.user._id }).session(session);

      if (!gameState || !studio) {
        const notFoundError = new Error("Game state or studio not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
      }

      // Delete all user movies
      await Movie.deleteMany({ studioId: studio._id }, { session });

      // Delete all user franchises
      await Franchise.deleteMany({ studioId: studio._id }, { session });

      // Delete all notifications for this gameState
      await Notification.deleteMany({ gameStateId: gameState._id }, { session });

      // Delete all talent history for this gameState
      await TalentHistory.deleteMany({ gameStateId: gameState._id }, { session });

      // Delete all past awards for this gameState
      await PastAward.deleteMany({ gameStateId: gameState._id }, { session });

      // Delete news items for this studio
      await NewsItem.deleteMany({ studioId: studio._id }, { session });

      // Delete TV shows
      await TVShow.deleteMany({ studioId: studio._id }, { session });

      // Delete studio upgrades
      await StudioUpgrade.deleteMany({ studioId: studio._id }, { session });

      // Clear market talents
      await MarketDirector.deleteMany({ userId: req.user._id }, { session });
      await MarketActor.deleteMany({ userId: req.user._id }, { session });
      await MarketCrewTeam.deleteMany({ userId: req.user._id }, { session });

      // Regenerate market talents
      const freshDirectors = generateDirectors(50).map((d) => ({ ...d, userId: req.user._id }));
      const freshActors = generateActors(100).map((a) => ({ ...a, userId: req.user._id }));
      const freshCrew = generateCrewTeams(25).map((c) => ({ ...c, userId: req.user._id }));

      await MarketDirector.insertMany(freshDirectors, { session });
      await MarketActor.insertMany(freshActors, { session });
      await MarketCrewTeam.insertMany(freshCrew, { session });

      // Reset GameState
      gameState.currentWeek = 1;
      gameState.lastSimulatedWeek = 0;
      gameState.ownedDirectors = [];
      gameState.ownedActors = [];
      gameState.ownedCrewTeams = [];
      gameState.ownedWriters = [];
      gameState.marketWriters = [];
      gameState.activeDirectorProjects = [];
      gameState.activeActorProjects = [];
      gameState.activeWritingProjects = [];
      gameState.retiredDirectors = [];
      gameState.retiredActors = [];
      gameState.directorAwardYearsProcessed = [];
      gameState.actorAwardYearsProcessed = [];
      gameState.rivalStudiosInitialized = false;
      gameState.rivalStudios = [];
      // reset streaming platform exclusives
      if (gameState.streamingPlatforms) {
        gameState.streamingPlatforms.forEach((p) => {
          p.exclusiveMovies = [];
        });
      }

      // Reset Studio
      studio.money = 10000000;
      studio.prestige = 0;
      studio.fans = 0;
      studio.studioLevel = 1;
      studio.highestGrossingMovie = undefined;
      studio.mostProfitableMovie = undefined;
      studio.bestReviewedMovie = undefined;
      studio.financialHistory = [];
      studio.stats = {
        moviesReleased: 0,
        hits: 0,
        blockbusters: 0,
        allTimeBlockbusters: 0,
        flops: 0,
        disasters: 0,
        totalRevenue: 0,
        totalProfit: 0,
        avgCriticScore: 0,
        avgAudienceScore: 0,
        awardsWon: 0,
      };

      await gameState.save({ session });
      await studio.save({ session });
    });

    res.status(200).json({
      success: true,
      message: "Game state reset successfully",
      studio,
      gameState,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    logger.error("Reset Transaction Error", { error: error.message });
    res.status(500).json({ success: false, message: `Operation rolled back due to: ${error.message}` });
  }
};
