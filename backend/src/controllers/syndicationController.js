import SyndicationDeal from "../models/SyndicationDeal.js";
import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import { calculateSyndicationValuation } from "../services/simulation/engines/syndicationEngine.js";

export const getStudioSyndicationDeals = async (req, res, next) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }
    const deals = await SyndicationDeal.find({ studioId: studio._id }).populate("movieId", "title posterUrl boxOffice");
    return res.status(200).json({ success: true, data: deals });
  } catch (error) {
    next(error);
  }
};

export const getMovieSyndicationValuation = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }
    const valuation = calculateSyndicationValuation(movie);
    return res.status(200).json({ success: true, data: valuation });
  } catch (error) {
    next(error);
  }
};

export const createSyndicationDeal = async (req, res, next) => {
  try {
    const { movieId, networkName, dealType, durationWeeks } = req.body;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    const valuation = calculateSyndicationValuation(movie);

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const deal = await SyndicationDeal.create({
      studioId: studio._id,
      movieId,
      networkName,
      dealType,
      upfrontBonus: valuation.upfrontBonus,
      weeklyRoyalty: valuation.weeklyRoyalty,
      totalWeeksDuration: durationWeeks || valuation.maxDurationWeeks,
      weeksRemaining: durationWeeks || valuation.maxDurationWeeks,
      status: "ACTIVE",
    });

    // Credit upfront bonus to studio money
    await Studio.findByIdAndUpdate(studio._id, {
      $inc: { money: valuation.upfrontBonus },
    });

    return res.status(201).json({
      success: true,
      message: "Syndication deal successfully negotiated and signed!",
      data: deal,
    });
  } catch (error) {
    next(error);
  }
};
