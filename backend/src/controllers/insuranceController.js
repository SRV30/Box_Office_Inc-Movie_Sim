/**
 * @fileoverview Insurance Controller Handlers
 */

import InsurancePolicy from "../models/InsurancePolicy.js";
import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import { calculateInsuranceQuote } from "../services/simulation/engines/insuranceEngine.js";

/**
 * POST /api/insurance/policies
 * Purchase an insurance policy for a movie in production (strictly owned by player's studio).
 */
export const purchasePolicy = async (req, res, next) => {
  try {
    const { movieId, policyType } = req.body;

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const movie = await Movie.findOne({ _id: movieId, studioId: studio._id });
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    const quote = calculateInsuranceQuote(movie.budget, policyType);

    const policy = await InsurancePolicy.create({
      userId: req.user._id,
      movieId: movie._id,
      policyType,
      coverageAmount: quote.coverageAmount,
      weeklyPremium: quote.weeklyPremium,
      status: "ACTIVE",
    });

    return res.status(201).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/insurance/policies
 * List active insurance policies for studio.
 */
export const getActivePolicies = async (req, res, next) => {
  try {
    const policies = await InsurancePolicy.find({ userId: req.user._id, status: "ACTIVE" }).populate("movieId", "title budget stage");
    return res.status(200).json({
      success: true,
      data: policies,
    });
  } catch (error) {
    next(error);
  }
};
