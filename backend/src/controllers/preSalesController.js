import Studio from "../models/Studio.js";
import GameState from "../models/GameState.js";
import Movie from "../models/Movie.js";

export const launchPreSales = async (req, res) => {
  try {
    const { movieId, budget } = req.body;
    if (!movieId || !budget || budget <= 0) {
      return res.status(400).json({ success: false, message: "movieId and positive budget required." });
    }

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) return res.status(404).json({ success: false, message: "Studio not found." });

    const gameState = await GameState.findOne({ user: req.user._id });
    if (!gameState) return res.status(404).json({ success: false, message: "Game state not found." });

    const movie = await Movie.findById(movieId);
    if (!movie || movie.status !== "POST_PRODUCTION") {
      return res.status(400).json({ success: false, message: "Movie must be in POST_PRODUCTION." });
    }

    if (Number(studio.money || 0) < budget) {
      return res.status(400).json({ success: false, message: "Insufficient funds." });
    }

    studio.money = Math.max(0, Number(studio.money || 0) - budget);
    if (!studio.preSalesCampaigns) studio.preSalesCampaigns = [];
    studio.preSalesCampaigns.push({
      movieId, budget, preSalesRevenue: 0,
      startWeek: gameState.currentWeek, active: true
    });
    await studio.save();

    res.status(201).json({
      success: true,
      message: `Pre-sales campaign launched with budget ₹${budget.toLocaleString("en-IN")}`,
      data: { studioMoney: studio.money, campaign: studio.preSalesCampaigns.at(-1) }
    });
  } catch (error) {
    console.error("Error launching pre-sales:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPreSales = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) return res.status(404).json({ success: false, message: "Studio not found." });

    res.status(200).json({
      success: true,
      data: studio.preSalesCampaigns || []
    });
  } catch (error) {
    console.error("Error fetching pre-sales:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
