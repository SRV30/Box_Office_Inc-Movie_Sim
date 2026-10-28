/**
 * @fileoverview Festival Submission Mongoose Model
 */

import mongoose from "mongoose";

const festivalSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    festivalName: {
      type: String,
      enum: ["CANNES", "SUNDANCE", "VENICE", "TIFF"],
      required: true,
    },
    entryFee: {
      type: Number,
      required: true,
    },
    juryScore: {
      type: Number,
      default: 0,
    },
    awardWon: {
      type: String,
      enum: ["PALME_D_OR", "GRAND_PRIX", "AUDIENCE_AWARD", "GOLDEN_LION", "GRAND_JURY_PRIZE", "PEOPLES_CHOICE", "NONE"],
      default: "NONE",
    },
    status: {
      type: String,
      enum: ["SUBMITTED", "ACCEPTED", "AWARDED", "REJECTED", "WITHDRAWN", "SIGNED"],
      default: "SUBMITTED",
    },
    prestigeTier: {
      type: String,
      enum: ["TIER_1_MAJORS", "TIER_2_PREMIERE", "TIER_3_REGIONAL"],
      default: "TIER_1_MAJORS",
    },
    marketDistributionOffer: {
      type: Number,
      default: 0,
    },
    criticHypeBoost: {
      type: Number,
      default: 1.0,
    },
    deliberation: {
      type: Object,
      default: {},
    },
    standingOvation: {
      type: Object,
      default: {},
    },
    distributorBids: [
      {
        distributor: { type: String, default: "" },
        amount: { type: Number, default: 0 },
        advance: { type: Number, default: 0 },
        note: { type: String, default: "" },
        status: { type: String, default: "PENDING" },
        festival: { type: String, default: "" },
      },
    ],
    signedDeal: {
      distributor: { type: String, default: "" },
      amount: { type: Number, default: 0 },
      advance: { type: Number, default: 0 },
      note: { type: String, default: "" },
      signedAt: { type: Date, default: null },
    },
    juryConsensusQuote: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const FestivalSubmission = mongoose.models.FestivalSubmission || mongoose.model("FestivalSubmission", festivalSubmissionSchema);

export default FestivalSubmission;
