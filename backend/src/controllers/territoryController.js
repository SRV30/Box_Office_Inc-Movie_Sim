import TerritoryLicensing from "../models/TerritoryLicensing.js";
import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import { calculateTerritoryDealOffer } from "../services/simulation/engines/territoryEngine.js";

export const getStudioTerritoryDeals = async (req, res, next) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }
    const deals = await TerritoryLicensing.find({ studioId: studio._id }).populate("movieId", "title posterUrl");
    return res.status(200).json({ success: true, data: deals });
  } catch (error) {
    next(error);
  }
};

export const getTerritoryOffer = async (req, res, next) => {
  try {
    const { movieId, region, dealType } = req.query;
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }
    const offer = calculateTerritoryDealOffer(movie, region, dealType);
    return res.status(200).json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};

export const signTerritoryDeal = async (req, res, next) => {
  try {
    const { movieId, region, dealType } = req.body;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    const offer = calculateTerritoryDealOffer(movie, region, dealType);

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }
    if (studio.money < offer.localizationCost) {
      return res.status(400).json({ success: false, message: "Insufficient funds for territory dubbing & localization" });
    }

    // Deduct dubbing cost and credit MG payout
    studio.money = studio.money - offer.localizationCost + offer.minimumGuarantee;
    await studio.save();

    const deal = await TerritoryLicensing.create({
      studioId: studio._id,
      movieId,
      region,
      dealType,
      minimumGuaranteePayout: offer.minimumGuarantee,
      revenueSharePercentage: offer.revenueSharePct,
      dubbingSubtitlingCost: offer.localizationCost,
      status: "SIGNED",
    });

    return res.status(201).json({
      success: true,
      message: `International territory licensing deal signed for ${region}`,
      data: deal,
    });
  } catch (error) {
    next(error);
  }
};
