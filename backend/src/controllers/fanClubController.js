import Studio from "../models/Studio.js";
import GameState from "../models/GameState.js";
import Movie from "../models/Movie.js";
import Notification from "../models/Notification.js";

const findGameState = async (userId) => GameState.findOne({ user: userId });

/**
 * Get current Fan Club & Convention details
 * GET /api/studios/fanclub
 */
export const getFanClubDetails = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const gameState = await findGameState(req.user._id);

    if (!studio.fanClub) {
      studio.fanClub = { weeklyBudget: 0, totalFans: 0, lastConventionWeek: null };
      await studio.save();
    }

    const currentWeek = gameState?.currentWeek || 1;
    const lastConvention = studio.fanClub.lastConventionWeek;
    const cooldownRemaining = lastConvention !== null ? Math.max(0, 52 - (currentWeek - lastConvention)) : 0;

    res.status(200).json({
      success: true,
      data: {
        fanClub: studio.fanClub,
        studioFans: studio.fans || 0,
        studioMoney: studio.money || 0,
        currentWeek,
        cooldownRemaining,
        canHostConvention: cooldownRemaining === 0 && (studio.money || 0) >= 2000000,
      },
    });
  } catch (error) {
    console.error("Error getting fan club details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Adjust weekly fan club maintenance budget.
 * PUT /api/studios/fanclub/budget
 */
export const updateFanClubBudget = async (req, res) => {
  try {
    const { weeklyBudget } = req.body;

    if (weeklyBudget === undefined || weeklyBudget < 0) {
      return res.status(400).json({
        success: false,
        message: "Weekly budget must be a non-negative number.",
      });
    }

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found.",
      });
    }

    if (!studio.fanClub) {
      studio.fanClub = { weeklyBudget: 0, totalFans: 0, lastConventionWeek: null };
    }

    studio.fanClub.weeklyBudget = Number(weeklyBudget);
    await studio.save();

    res.status(200).json({
      success: true,
      message: `Weekly fan club budget updated to ₹${weeklyBudget.toLocaleString("en-IN")}`,
      data: studio.fanClub,
    });
  } catch (error) {
    console.error("Error updating fan club budget:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Host annual Studio Convention.
 * POST /api/studios/fanclub/convention
 *
 * Costs ₹2,000,000 upfront.
 * Boosts hype of all active movies in production by +15.
 * Has a 52-week cooldown.
 */
export const hostConvention = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found.",
      });
    }

    const gameState = await findGameState(req.user._id);
    if (!gameState) {
      return res.status(404).json({
        success: false,
        message: "Game state not found.",
      });
    }

    if (!studio.fanClub) {
      studio.fanClub = { weeklyBudget: 0, totalFans: 0, lastConventionWeek: null };
    }

    const currentWeek = gameState.currentWeek || 1;
    const lastConvention = studio.fanClub.lastConventionWeek;

    if (lastConvention !== null && currentWeek - lastConvention < 52) {
      return res.status(400).json({
        success: false,
        message: `Convention is on cooldown. You can host another in ${52 - (currentWeek - lastConvention)} weeks.`,
      });
    }

    const CONVENTION_COST = 2000000;
    if (Number(studio.money || 0) < CONVENTION_COST) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Hosting a convention costs ₹${CONVENTION_COST.toLocaleString("en-IN")}.`,
      });
    }

    // Deduct cost
    studio.money = Math.max(0, Number(studio.money || 0) - CONVENTION_COST);
    studio.fanClub.lastConventionWeek = currentWeek;

    // Boost hype for all active movies in production by +15
    const activeMovies = await Movie.find({
      _id: { $in: gameState.activeMovies || [] },
      status: { $in: ["PRE_PRODUCTION", "PRODUCTION", "POST_PRODUCTION"] }
    });

    for (const movie of activeMovies) {
      movie.hype = Math.min(100, (movie.hype || 0) + 15);
      await movie.save();
    }

    // Boost fans
    const newFansGained = 50000 + Math.floor(Math.random() * 50000);
    studio.fanClub.totalFans = (studio.fanClub.totalFans || 0) + newFansGained;
    // Also boost studio fans generally
    studio.fans = (studio.fans || 0) + newFansGained;

    await studio.save();

    await Notification.create({
      gameStateId: gameState._id,
      message: `Hosted the annual Studio Convention! Gained ${newFansGained.toLocaleString("en-IN")} new fans, and boosted hype for ${activeMovies.length} movies in production.`,
    });

    res.status(200).json({
      success: true,
      message: "Convention hosted successfully!",
      data: {
        totalFans: studio.fanClub.totalFans,
        studioMoney: studio.money,
        newFansGained,
        moviesBoosted: activeMovies.length,
      },
    });
  } catch (error) {
    console.error("Error hosting convention:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
