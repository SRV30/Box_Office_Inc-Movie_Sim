import MerchandiseDeal from "../models/MerchandiseDeal.js";
import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import { calculateMerchandiseValuation, processWeeklyMerchandiseSales } from "../services/merchandiseEngine.js";

export const getMerchandiseValuation = async (req, res) => {
  try {
    const { movieId, category, tier } = req.body;
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    const valuation = calculateMerchandiseValuation(movie, category, tier);
    return res.status(200).json({ success: true, valuation });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createMerchandiseDeal = async (req, res) => {
  try {
    const { movieId, category, tier } = req.body;
    const studioId = req.user.studioId || req.user._id;

    const movie = await Movie.findOne({ _id: movieId, studioId });
    if (!movie) {
      return res.status(404).json({ message: "Movie not found or does not belong to studio" });
    }

    const existingDeal = await MerchandiseDeal.findOne({ movieId, category, status: "ACTIVE" });
    if (existingDeal) {
      return res.status(400).json({ message: "Active merchandise deal already exists for this category" });
    }

    const valuation = calculateMerchandiseValuation(movie, category, tier);

    const deal = await MerchandiseDeal.create({
      studioId,
      movieId,
      category,
      tier,
      advanceRoyalty: valuation.advanceRoyalty,
      royaltyPercentage: valuation.royaltyPercentage,
      inventoryUnits: valuation.inventoryUnits,
    });

    // Credit advance royalty to studio
    await Studio.findByIdAndUpdate(studioId, {
      $inc: { money: valuation.advanceRoyalty },
    });

    return res.status(201).json({ success: true, deal });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getStudioMerchandiseDeals = async (req, res) => {
  try {
    const studioId = req.user.studioId || req.user._id;
    const deals = await MerchandiseDeal.find({ studioId }).populate("movieId", "title poster rating boxOfficeTotal");
    return res.status(200).json({ success: true, deals });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const triggerWeeklyMerchandiseProcessing = async (req, res) => {
  try {
    const result = await processWeeklyMerchandiseSales();
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
