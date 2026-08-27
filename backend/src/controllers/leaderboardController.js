import {
  getIndustryLeaderboard,
  RANKING_METRICS,
  TIME_PERIODS,
} from "../services/simulation/industryLeaderboardEngine.js";
import GameState from "../models/GameState.js";

// GET /api/leaderboard?metric=<metric>&period=<period>&includeAI=<bool>&page=<n>&limit=<n>
export const getLeaderboard = async (req, res) => {
  try {
    const metric = String(req.query.metric || "prestige").toLowerCase();
    const period = String(req.query.period || "all_time").toLowerCase();
    const includeAI = req.query.includeAI !== "false";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    let currentWeek = 52;
    if (req.user?._id) {
      const gameState = await GameState.findOne({ user: req.user._id }).select("currentWeek").lean();
      if (gameState?.currentWeek) {
        currentWeek = gameState.currentWeek;
      }
    }

    const result = await getIndustryLeaderboard({
      metric,
      period,
      currentWeek,
      includeAI,
      page,
      limit,
      currentUserId: req.user?._id,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

