import TerritoryLicensing from "../models/TerritoryLicensing.js";
import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import { calculateTerritoryDealOffer } from "../services/simulation/engines/territoryEngine.js";
import { withTransaction } from "../utils/financeTransactionHelper.js";

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

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const movie = await Movie.findOne({ _id: movieId, studioId: studio._id });
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

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const movie = await Movie.findOne({ _id: movieId, studioId: studio._id });
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    const offer = calculateTerritoryDealOffer(movie, region, dealType);

    if (studio.money < offer.localizationCost) {
      return res.status(400).json({ success: false, message: "Insufficient funds for territory dubbing & localization" });
    }

    let createdDeal = null;

    // Execute balance debit/credit and deal creation atomically in transaction
    await withTransaction(async (session) => {
      const s = await Studio.findOne({
        _id: studio._id,
        money: { $gte: offer.localizationCost },
      }).session(session);

      if (!s) {
        throw new Error("Insufficient funds for territory dubbing & localization");
      }

      s.money = s.money - offer.localizationCost + offer.minimumGuarantee;
      await s.save({ session });

      const [deal] = await TerritoryLicensing.create(
        [
          {
            studioId: s._id,
            movieId: movie._id,
            region,
            dealType,
            minimumGuaranteePayout: offer.minimumGuarantee,
            revenueSharePercentage: offer.revenueSharePct,
            dubbingSubtitlingCost: offer.localizationCost,
            status: "SIGNED",
          },
        ],
        { session }
      );

      createdDeal = deal;
    });

    return res.status(201).json({
      success: true,
      message: `International territory licensing deal signed for ${region}`,
      data: createdDeal,
    });
  } catch (error) {
    next(error);
  }
};
