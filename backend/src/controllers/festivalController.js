import FestivalSubmission from "../models/FestivalSubmission.js";
import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import { deliberateFestivalJury, generateDistributorOffers } from "../services/festival/festivalJuryEngine.js";
import { withTransaction } from "../utils/financeTransactionHelper.js";

/**
 * POST /api/festivals/submit
 * Submits a movie to a prestige film festival circuit with atomic fee deduction and jury deliberation.
 */
export const submitToFestival = async (req, res, next) => {
  try {
    const { movieId, festivalName } = req.body;

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio profile not found" });
    }

    const movie = await Movie.findOne({ _id: movieId, studioId: studio._id });
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    const entryFees = { CANNES: 500000, SUNDANCE: 250000, VENICE: 400000, TIFF: 300000 };
    const fee = entryFees[festivalName] || 250000;

    // Execute jury deliberation simulation and market bids
    const deliberation = deliberateFestivalJury(movie, festivalName);
    const distributionBids = generateDistributorOffers(deliberation.juryScore, movie.budget);
    const topOffer = distributionBids[0]?.advancePayment || 0;

    // Atomically verify studio existence and ownership, deduct entry fee, and persist festival submission
    const submission = await withTransaction(async (session) => {
      const s = await Studio.findOne({ owner: req.user._id }).session(session);
      if (!s) {
        const error = new Error("Studio profile not found. Please establish your studio first.");
        error.status = 404;
        throw error;
      }

      const m = await Movie.findOne({ _id: movieId, studioId: s._id }).session(session);
      if (!m) {
        const error = new Error("Movie not found");
        error.status = 404;
        throw error;
      }

      if (s.money < fee) {
        const error = new Error(`Insufficient studio funds for festival entry fee (Requires ₹${fee.toLocaleString()})`);
        error.status = 400;
        throw error;
      }

      s.money -= fee;

      if (deliberation.awardWon !== "NONE") {
        s.prestige = (s.prestige || 0) + 15;
      }
      await s.save({ session });

      const [createdSubmission] = await FestivalSubmission.create(
        [
          {
            userId: req.user._id,
            movieId: m._id,
            festivalName,
            entryFee: fee,
            juryScore: deliberation.juryScore,
            awardWon: deliberation.awardWon,
            status: deliberation.status,
            criticHypeBoost: deliberation.criticHypeBoost,
            marketDistributionOffer: topOffer,
            juryDeliberation: {
              standingOvationMinutes: deliberation.standingOvationMinutes,
              consensusQuote: deliberation.consensusQuote,
              pillarScores: deliberation.pillarScores,
            },
            distributionBids,
          },
        ],
        { session }
      );

      return createdSubmission;
    });

    return res.status(201).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * GET /api/festivals/active
 * Retrieves all festival submissions for current user studio.
 */
export const getActiveSubmissions = async (req, res, next) => {
  try {
    const submissions = await FestivalSubmission.find({ userId: req.user._id })
      .populate("movieId", "title quality criticScore budget genre releaseDate")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: submissions,
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

/**
 * POST /api/festivals/accept-distribution
 * Accepts a competitive distributor acquisition contract, crediting studio funds atomically.
 */
export const acceptDistributionDeal = async (req, res, next) => {
  try {
    const { submissionId, distributorName } = req.body;

    const result = await withTransaction(async (session) => {
      const studio = await Studio.findOne({ owner: req.user._id }).session(session);
      if (!studio) {
        const error = new Error("Studio profile not found. Please establish your studio first.");
        error.status = 404;
        throw error;
      }

      const submission = await FestivalSubmission.findOne({ _id: submissionId, userId: req.user._id }).session(session);
      if (!submission) {
        const error = new Error("Festival submission not found");
        error.status = 404;
        throw error;
      }

      if (submission.status === "ACQUIRED") {
        const error = new Error("A distribution contract has already been signed for this submission");
        error.status = 400;
        throw error;
      }

      const selectedBid = submission.distributionBids.find((b) => b.distributorName === distributorName);
      if (!selectedBid) {
        const error = new Error("Selected distributor bid not found");
        error.status = 404;
        throw error;
      }

      submission.status = "ACQUIRED";
      submission.acceptedDeal = {
        distributorName: selectedBid.distributorName,
        advancePayment: selectedBid.advancePayment,
        boxOfficeRoyaltyCut: selectedBid.boxOfficeRoyaltyCut,
        signedAt: new Date(),
      };
      await submission.save({ session });

      studio.money = (studio.money || 0) + selectedBid.advancePayment;
      studio.prestige = (studio.prestige || 0) + 10;
      await studio.save({ session });

      return {
        submission,
        studioFunds: studio.money,
        selectedBid,
      };
    });

    return res.status(200).json({
      success: true,
      message: `Successfully inked distribution deal with ${result.selectedBid.distributorName}! Advance of ₹${result.selectedBid.advancePayment.toLocaleString()} credited to studio treasury.`,
      data: {
        submission: result.submission,
        studioFunds: result.studioFunds,
      },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * GET /api/festivals/laurels
 * Returns all awarded festival laurels and accolades won by the studio's films.
 */
export const getFestivalLaurels = async (req, res, next) => {
  try {
    const awardedSubmissions = await FestivalSubmission.find({
      userId: req.user._id,
      awardWon: { $ne: "NONE" },
    })
      .populate("movieId", "title quality genre releaseDate poster")
      .sort({ createdAt: -1 });

    const laurels = awardedSubmissions.map((sub) => ({
      submissionId: sub._id,
      festivalName: sub.festivalName,
      awardTitle: sub.awardWon,
      movieTitle: sub.movieId?.title || "Feature Film",
      movieId: sub.movieId?._id,
      juryScore: sub.juryScore,
      standingOvationMinutes: sub.juryDeliberation?.standingOvationMinutes || 0,
      consensusQuote: sub.juryDeliberation?.consensusQuote || "",
      year: new Date(sub.createdAt).getFullYear(),
    }));

    return res.status(200).json({
      success: true,
      data: laurels,
    });
  } catch (error) {
    next(error);
  }
};
