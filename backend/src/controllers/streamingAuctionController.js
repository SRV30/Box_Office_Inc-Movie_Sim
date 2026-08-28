import StreamingAuction from "../models/StreamingAuction.js";
import StreamingRights from "../models/StreamingRights.js";
import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import GameState from "../models/GameState.js";
import { runStreamingAuction, evaluateContentValue } from "../services/streamingAuctionEngine.js";
import { hasConflictingRights, processAICounteroffers } from "../services/simulation/engines/streamingWarsEngine.js";
import { getOTTPlatformList, EXCLUSIVITY_WINDOWS } from "../constants/streamingWars.js";
import { initializeStreamingPlatforms } from "../services/simulation/engines/streamingEngine.js";

export const createStreamingAuction = async (req, res) => {
  try {
    const { movieId, windowType, askingPrice } = req.body;

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const movie = await Movie.findOne({ _id: movieId, studioId: studio._id });
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found or unauthorized" });
    }

    const conflict = await hasConflictingRights(movie._id, "MOVIE");
    if (conflict) {
      return res.status(400).json({ success: false, message: "This content already has active exclusive streaming rights." });
    }

    const existingAuction = await StreamingAuction.findOne({ movieId, status: "OPEN" });
    if (existingAuction) {
      return res.status(400).json({ success: false, message: "An active streaming auction is already open for this movie" });
    }

    const auction = await StreamingAuction.create({
      studioId: studio._id,
      movieId,
      windowType,
      askingPrice,
      exclusiveWeeks: EXCLUSIVITY_WINDOWS[windowType]?.weeks || 52,
    });

    return res.status(201).json({ success: true, auction, estimatedValue: evaluateContentValue(movie, windowType) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const executeAuctionBidding = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const gameState = await GameState.findOne({ user: req.user._id });
    await initializeStreamingPlatforms(gameState);
    const auction = await runStreamingAuction(auctionId, gameState);
    return res.status(200).json({ success: true, auction });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const submitCounteroffer = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { amount, platformId } = req.body;

    const auction = await StreamingAuction.findById(auctionId);
    if (!auction || auction.status !== "OPEN") {
      return res.status(400).json({ success: false, message: "Auction not open for counteroffers." });
    }

    const platform = getOTTPlatformList().find((p) => p.id === platformId);
    if (!platform) {
      return res.status(400).json({ success: false, message: "Invalid platform." });
    }

    auction.counteroffers = auction.counteroffers || [];
    auction.counteroffers.push({
      platformId: platform.id,
      platform: platform.name,
      amount,
      isAI: false,
      week: 0,
    });
    await auction.save();

    return res.status(200).json({ success: true, message: "Counteroffer submitted.", auction });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudioAuctions = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const auctions = await StreamingAuction.find({ studioId: studio._id })
      .populate("movieId", "title quality criticScore worldwideGross budget boxOffice hype")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, auctions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getStreamingPlatforms = async (req, res) => {
  try {
    const gameState = await GameState.findOne({ user: req.user._id });
    if (gameState) await initializeStreamingPlatforms(gameState);

    return res.status(200).json({
      success: true,
      platforms: gameState?.streamingPlatforms || getOTTPlatformList(),
      windows: EXCLUSIVITY_WINDOWS,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getStreamingRights = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const rights = await StreamingRights.find({ studioId: studio._id })
      .sort({ startWeek: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({ success: true, rights });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getStreamingWarsAnalytics = async (req, res) => {
  try {
    const gameState = await GameState.findOne({ user: req.user._id });
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!gameState || !studio) {
      return res.status(404).json({ success: false, message: "Game state not found." });
    }

    const openAuctions = await StreamingAuction.find({ studioId: studio._id, status: "OPEN" });
    const activeRights = await StreamingRights.countDocuments({ studioId: studio._id, status: "ACTIVE" });
    const completedAuctions = await StreamingAuction.countDocuments({ studioId: studio._id, status: "COMPLETED" });

    const totalBidValue = await StreamingAuction.aggregate([
      { $match: { studioId: studio._id, status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$winningBidAmount" } } },
    ]);

    return res.status(200).json({
      success: true,
      analytics: {
        openAuctions: openAuctions.length,
        activeRights,
        completedAuctions,
        totalBidRevenue: totalBidValue[0]?.total || 0,
        platforms: (gameState.streamingPlatforms || []).map((p) => ({
          id: p.id,
          name: p.name,
          subscribers: p.subscribers,
          prestige: p.prestige ?? p.popularity,
          contentBudget: p.contentBudget,
          exclusiveCount: p.exclusiveMovies?.length || 0,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
