import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import GameState from "../models/GameState.js";
import { getMarketList } from "../constants/cinemaMarkets.js";
import {
  calculateMultiMarketRelease,
  projectMarketRevenue,
} from "../services/simulation/engines/cinemaMarketEngine.js";

/**
 * GET /api/cinema-markets
 */
export const getCinemaMarkets = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      markets: getMarketList(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/cinema-markets/movies
 */
export const getStudioMarketMovies = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found." });
    }

    const movies = await Movie.find({
      studioId: studio._id,
      status: { $nin: ["RELEASED", "RELEASED_STREAMING"] },
    })
      .select("title status genre targetMarkets primaryMarket crossMarketRelease budget hype quality")
      .lean();

    return res.status(200).json({ success: true, movies });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/cinema-markets/movies/:movieId/targets
 */
export const setMovieTargetMarkets = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { targetMarkets, primaryMarket, crossMarketRelease, isCoProduction } = req.body;

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found." });
    }

    if (!targetMarkets.includes(primaryMarket)) {
      return res.status(400).json({
        success: false,
        message: "Primary market must be included in target markets.",
      });
    }

    const movie = await Movie.findOne({ _id: movieId, studioId: studio._id });
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found." });
    }

    movie.targetMarkets = targetMarkets;
    movie.primaryMarket = primaryMarket;
    movie.crossMarketRelease = crossMarketRelease ?? targetMarkets.length > 1;
    movie.isCoProduction = isCoProduction ?? false;
    await movie.save();

    return res.status(200).json({
      success: true,
      message: `Market targets updated for "${movie.title}".`,
      movie,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/cinema-markets/movies/:movieId/projections
 */
export const getMovieMarketProjections = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    const gameState = await GameState.findOne({ user: req.user._id });
    if (!studio || !gameState) {
      return res.status(404).json({ success: false, message: "Game state not found." });
    }

    const movie = await Movie.findOne({ _id: req.params.movieId, studioId: studio._id });
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found." });
    }

    const leadActor = gameState.ownedActors.find((a) => a.id === movie.leadActorId) || {};
    const director = gameState.ownedDirectors.find((d) => d.id === movie.directorId) || {};
    const targets = movie.targetMarkets?.length ? movie.targetMarkets : [movie.primaryMarket || "BOLLYWOOD"];

    const projection = projectMarketRevenue(
      movie,
      leadActor,
      director,
      targets,
      movie.primaryMarket || targets[0]
    );

    return res.status(200).json({ success: true, projection });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/cinema-markets/analytics
 */
export const getCinemaMarketAnalytics = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found." });
    }

    const released = await Movie.find({
      studioId: studio._id,
      status: { $in: ["RELEASED", "RELEASED_STREAMING"] },
      cinemaMarketRevenue: { $exists: true, $ne: [] },
    }).lean();

    const marketTotals = {};
    let totalRevenue = 0;

    for (const movie of released) {
      for (const entry of movie.cinemaMarketRevenue || []) {
        marketTotals[entry.marketId] = (marketTotals[entry.marketId] || 0) + (entry.grossINR || 0);
        totalRevenue += entry.grossINR || 0;
      }
    }

    const breakdown = Object.entries(marketTotals).map(([marketId, grossINR]) => ({
      marketId,
      grossINR,
      share: totalRevenue > 0 ? Number(((grossINR / totalRevenue) * 100).toFixed(1)) : 0,
    }));

    return res.status(200).json({
      success: true,
      analytics: {
        totalRevenue,
        marketBreakdown: breakdown,
        releasedCount: released.length,
        crossMarketReleases: released.filter((m) => (m.targetMarkets?.length || 0) > 1).length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
