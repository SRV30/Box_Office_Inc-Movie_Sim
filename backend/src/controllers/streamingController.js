import GameState from "../models/GameState.js";
import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import { addNotification } from "../services/simulation/helpers/notificationHelper.js";
import { calculateStreamingRevenuePotential, computeHybridReleaseStrategy } from "../services/simulation/engines/streamingEngine.js";

// Get all streaming platforms
export const getPlatforms = async (req, res) => {
  try {
    const gameState = await GameState.findOne({ user: req.user._id })
      .populate({
          path: "streamingPlatforms.exclusiveMovies",
          select: "title quality hype verdict profit roi boxOffice releaseWeek"
      });

    if (!gameState) {
      return res.status(404).json({ success: false, message: "Game state not found" });
    }

    res.status(200).json({ success: true, platforms: gameState.streamingPlatforms || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get aggregated streaming catalog across platforms
export const getStreamingCatalog = async (req, res) => {
  try {
    const gameState = await GameState.findOne({ user: req.user._id })
      .populate({
        path: "streamingPlatforms.exclusiveMovies",
        select: "title quality hype verdict profit roi boxOffice releaseWeek releaseType poster"
      });

    if (!gameState) {
      return res.status(404).json({ success: false, message: "Game state not found" });
    }

    const { platformId, search } = req.query;

    let allMovies = [];
    const platforms = gameState.streamingPlatforms || [];

    platforms.forEach((plat) => {
      if (!platformId || plat.id === platformId) {
        (plat.exclusiveMovies || []).forEach((mov) => {
          allMovies.push({
            ...mov.toObject(),
            platformId: plat.id,
            platformName: plat.name,
            platformPopularity: plat.popularity,
          });
        });
      }
    });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      allMovies = allMovies.filter((m) => m.title && m.title.toLowerCase().includes(q));
    }

    res.status(200).json({
      success: true,
      count: allMovies.length,
      movies: allMovies,
      platforms: platforms.map(p => ({
        id: p.id,
        name: p.name,
        subscribers: p.subscribers,
        popularity: p.popularity,
        contentBudget: p.contentBudget,
        exclusiveCount: p.exclusiveMovies ? p.exclusiveMovies.length : 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get recommended streaming release strategy for a movie
export const getStreamingStrategy = async (req, res) => {
  try {
    const { movieId } = req.params;
    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    const gameState = await GameState.findOne({ user: req.user._id });
    const platformSubscribers = gameState?.streamingPlatforms?.[0]?.subscribers || 30000000;

    const revenuePotential = calculateStreamingRevenuePotential(movie, platformSubscribers);
    const hybridStrategy = computeHybridReleaseStrategy(
      movie.worldwideGross || 0,
      (movie.budget || 0) + (movie.marketingBudget || 0),
      movie.releaseWeek ? (gameState?.currentWeek || 1) - movie.releaseWeek : 1
    );

    return res.status(200).json({
      success: true,
      data: {
        movieId: movie._id,
        title: movie.title,
        revenuePotential,
        hybridStrategy,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Accept a streaming deal for a movie
export const acceptStreamingDeal = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    if (movie.status !== "READY_FOR_RELEASE") {
      return res.status(400).json({ success: false, message: "Movie is not ready for release" });
    }

    if (!movie.streamingDeal || movie.streamingDeal.status !== "OFFERED") {
      return res.status(400).json({ success: false, message: "No active streaming deal offer for this movie" });
    }

    const gameState = await GameState.findOne({ user: req.user._id });
    const studio = await Studio.findOne({ owner: req.user._id });

    if (!gameState || !studio) {
      return res.status(404).json({ success: false, message: "Game state or studio not found" });
    }

    const platform = gameState.streamingPlatforms.find(p => p.id === movie.streamingDeal.platformId);
    if (!platform) {
      return res.status(400).json({ success: false, message: "Streaming platform not found" });
    }

    // Process deal
    movie.streamingDeal.status = "ACCEPTED";
    movie.releaseType = "STREAMING";
    movie.status = "RELEASED_STREAMING";
    movie.verdict = "STREAMING_EXCLUSIVE";
    movie.releaseWeek = gameState.currentWeek;
    
    // Set financials
    const totalCost = movie.budget + movie.marketingBudget;
    movie.boxOffice = movie.streamingDeal.dealValue; // Track deal as revenue
    movie.worldwideGross = movie.streamingDeal.dealValue;
    movie.profit = movie.streamingDeal.dealValue - totalCost;
    movie.roi = totalCost > 0 ? movie.profit / totalCost : 0;
    
    // Immediate payout
    studio.money += movie.streamingDeal.dealValue;
    
    // Add to platform
    platform.exclusiveMovies.push(movie._id);
    platform.contentBudget -= movie.streamingDeal.dealValue;

    // Platform boost from new exclusive
    const qualityBoost = Math.max(0, (movie.quality - 50) / 10);
    platform.popularity = Math.min(100, platform.popularity + qualityBoost);
    platform.subscribers += Math.round(movie.hype * 10000 * (movie.quality / 100));

    // Move to history
    gameState.activeMovies = gameState.activeMovies.filter(id => id.toString() !== movie._id.toString());
    gameState.movieHistory.push(movie._id);

    addNotification(gameState, `Sold exclusive streaming rights for "${movie.title}" to ${platform.name} for ₹${(movie.streamingDeal.dealValue / 1000000).toFixed(1)}M.`);

    await movie.save();
    await studio.save();
    await gameState.save();

    res.status(200).json({ success: true, message: "Streaming deal accepted successfully", movie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
