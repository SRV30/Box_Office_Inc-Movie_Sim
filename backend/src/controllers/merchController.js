import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import GameState from "../models/GameState.js";
import { MERCH_BOOST_COST } from "../constants/gameConstants.js";
import { withTransaction } from "../utils/financeTransactionHelper.js";

export const getMerchandiseStats = async (req, res) => {
  try {
    const gameState = await GameState.findOne({ user: req.user._id });
    if (!gameState) {
      return res.status(404).json({ success: false, message: "Game state not found" });
    }

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const movies = await Movie.find({
      studioId: studio._id,
      status: "RELEASED"
    });

    const activeMerchMovies = movies.map(movie => {
      const weeksSinceRelease = Math.max(1, gameState.currentWeek - (movie.releaseWeek || gameState.currentWeek));
      const decay = Math.pow(0.9, weeksSinceRelease);
      const potential = (movie.boxOffice || 0) * 0.001;
      
      let modifier = (movie.hype || 50) / 100;
      if (movie.verdict === "Blockbuster" || movie.verdict === "All-Time Blockbuster") {
        modifier *= 1.5;
      } else if (movie.verdict === "Hit") {
        modifier *= 1.2;
      } else if (movie.verdict === "Flop" || movie.verdict === "Disaster") {
        modifier *= 0.2;
      }

      // Add merchandise level multiplier
      const levelMultiplier = 1 + (movie.merchandiseLevel || 0) * 0.25;
      const weeklyProj = Math.round(potential * modifier * decay * levelMultiplier);

      return {
        id: movie._id,
        title: movie.title,
        boxOffice: movie.boxOffice || 0,
        verdict: movie.verdict,
        hype: movie.hype,
        weeksSinceRelease,
        decayFactor: decay.toFixed(2),
        merchandiseLevel: movie.merchandiseLevel || 0,
        merchandiseRevenue: movie.merchandiseRevenue || 0,
        weeklyProjection: weeklyProj
      };
    });

    res.status(200).json({
      activeMovies: activeMerchMovies,
      merchandiseIncomeHistory: studio.merchandiseIncomeHistory || [],
      totalMerchandiseRevenue: activeMerchMovies.reduce((sum, m) => sum + m.merchandiseRevenue, 0)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const boostMerchandiseLevel = async (req, res) => {
  try {
    const { movieId } = req.params;
    let movie;
    let studio;

    await withTransaction(async (session) => {
      studio = await Studio.findOne({ owner: req.user._id }).session(session);
      if (!studio) {
        const error = new Error("Studio not found");
        error.statusCode = 404;
        throw error;
      }

      movie = await Movie.findOne({ _id: movieId, studioId: studio._id }).session(session);
      if (!movie) {
        const error = new Error("Movie not found or unauthorized");
        error.statusCode = 404;
        throw error;
      }

      const cost = 2500000; // 2.5 million rupees
      if (studio.money < cost) {
        const error = new Error("Insufficient funds to upgrade merchandising campaign");
        error.statusCode = 400;
        throw error;
      }

      movie.merchandiseLevel = (movie.merchandiseLevel || 0) + 1;
      studio.money -= MERCH_BOOST_COST;

      await movie.save({ session });
      await studio.save({ session });
    });

    res.status(200).json({
      message: `Successfully upgraded ${movie.title} merchandise campaign to Level ${movie.merchandiseLevel}`,
      movie,
      studioMoney: studio.money
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
