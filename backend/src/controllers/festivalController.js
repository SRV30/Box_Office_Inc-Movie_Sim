import FestivalSubmission from "../models/FestivalSubmission.js";
import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import {
  calculateFestivalJuryScore,
  calculatePrestigeHypeBoost,
  calculateMarketDistributionOffer,
} from "../services/simulation/engines/festivalEngine.js";
import {
  generateFestivalDeliberation,
  generateDistributorBids,
  getFestivalProfile,
} from "../services/festival/festivalJuryEngine.js";

/**
 * POST /api/festivals/submit
 * Submits a movie to a prestige film festival circuit.
 */
export const submitToFestival = async (req, res, next) => {
  try {
    const { movieId, festivalName } = req.body;
    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    const profile = getFestivalProfile(festivalName);
    const fee = profile.entryFee || 250000;

    const juryScore = calculateFestivalJuryScore(movie, festivalName);
    const deliberation = generateFestivalDeliberation(movie, festivalName);
    const distributorBids = generateDistributorBids(movie, festivalName, juryScore);

    let awardWon = "NONE";
    let status = deliberation.totalScore >= 65 ? "ACCEPTED" : "REJECTED";

    if (deliberation.totalScore >= 85) {
      status = "AWARDED";
      awardWon = profile.topAward;
    }

    const criticHypeBoost = calculatePrestigeHypeBoost(awardWon);
    const marketDistributionOffer = calculateMarketDistributionOffer(juryScore, movie.budget);

    const submission = await FestivalSubmission.create({
      userId: req.user._id,
      movieId,
      festivalName,
      entryFee: fee,
      juryScore,
      awardWon,
      status,
      criticHypeBoost,
      marketDistributionOffer,
      deliberation: {
        pillars: deliberation.pillars,
        totalScore: deliberation.totalScore,
        standingOvation: deliberation.standingOvation,
        juryConsensusQuote: deliberation.juryConsensusQuote,
      },
      standingOvation: deliberation.standingOvation,
      distributorBids,
      juryConsensusQuote: deliberation.juryConsensusQuote,
    });

    return res.status(201).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/festivals/active
 * Retrieves all festival submissions for current user studio.
 */
export const getActiveSubmissions = async (req, res, next) => {
  try {
    const submissions = await FestivalSubmission.find({ userId: req.user._id }).populate("movieId", "title quality criticScore audienceScore hype budget");
    return res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    next(error);
  }
};

export const getFestivalLaurels = async (req, res, next) => {
  try {
    const laurels = await FestivalSubmission.find({ userId: req.user._id, awardWon: { $ne: "NONE" } })
      .populate("movieId", "title budget")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: laurels,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/festivals/withdraw
 * Withdraws a festival submission prior to jury screening.
 */
export const withdrawSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.body;
    const submission = await FestivalSubmission.findOne({ _id: submissionId, userId: req.user._id });

    if (!submission) {
      return res.status(404).json({ success: false, message: "Festival submission not found" });
    }

    submission.status = "WITHDRAWN";
    await submission.save();

    return res.status(200).json({
      success: true,
      message: "Submission withdrawn successfully",
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptDistributionDeal = async (req, res, next) => {
  try {
    const { submissionId, distributor, amount } = req.body;

    const submission = await FestivalSubmission.findOne({ _id: submissionId, userId: req.user._id });
    if (!submission) {
      return res.status(404).json({ success: false, message: "Festival submission not found" });
    }

    const chosenBid = submission.distributorBids?.find((bid) => bid.distributor === distributor && bid.amount === amount);
    if (!chosenBid) {
      return res.status(400).json({ success: false, message: "Distribution bid not found or no longer available" });
    }

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    chosenBid.status = "SIGNED";
    submission.status = "SIGNED";
    submission.signedDeal = {
      distributor: chosenBid.distributor,
      amount: chosenBid.amount,
      advance: chosenBid.advance,
      note: chosenBid.note,
      signedAt: new Date(),
    };
    submission.marketDistributionOffer = chosenBid.amount;

    studio.money = (studio.money || 0) + (chosenBid.advance || chosenBid.amount);
    await submission.save();
    await studio.save();

    return res.status(200).json({
      success: true,
      message: `${distributor} distribution deal signed. Advance credited to studio treasury.`,
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

