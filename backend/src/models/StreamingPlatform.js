import mongoose from "mongoose";

const catalogItemSchema = new mongoose.Schema(
  {
    contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    contentType: {
      type: String,
      enum: ["MOVIE", "TV_SHOW"],
      default: "MOVIE",
    },
    title: { type: String, required: true },
    genre: { type: String, default: "Drama" },
    qualityScore: { type: Number, default: 60, min: 0, max: 100 },
    popularityScore: { type: Number, default: 50, min: 0, max: 100 },
    isExclusive: { type: Boolean, default: false },
    weeklyLicensingCost: { type: Number, default: 15000 },
    addedWeek: { type: Number, default: 1 },
    totalWatchHours: { type: Number, default: 0 },
  },
  { _id: true }
);

const streamingPlatformSchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      default: null,
      index: true,
    },
    isPlayerPlatform: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    tagline: {
      type: String,
      default: "Stream premium entertainment on demand.",
    },
    strategy: {
      type: String,
      enum: [
        "PRESTIGE_FIRST",
        "BLOCKBUSTER_FOCUSED",
        "BUDGET_MASS_MARKET",
        "NICHE_INDIE",
        "BALANCED",
      ],
      default: "BALANCED",
    },
    monthlySubscriptionPrice: {
      type: Number,
      default: 9.99,
      min: 2.99,
      max: 29.99,
    },
    subscribers: {
      type: Number,
      default: 1000000,
      min: 0,
    },
    weeklySubscriberGrowth: {
      type: Number,
      default: 15000,
    },
    weeklySubscriberChurn: {
      type: Number,
      default: 8000,
    },
    churnRatePercent: {
      type: Number,
      default: 2.5,
      min: 0.5,
      max: 25.0,
    },
    prestigeRating: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    recommendationTechLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
    serverBandwidthTier: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    catalog: [catalogItemSchema],
    weeklyGrossRevenue: {
      type: Number,
      default: 0,
    },
    weeklyServerCost: {
      type: Number,
      default: 0,
    },
    weeklyContentCost: {
      type: Number,
      default: 0,
    },
    weeklyNetProfit: {
      type: Number,
      default: 0,
    },
    totalCumulativeProfit: {
      type: Number,
      default: 0,
    },
    historicalSubscribers: [
      {
        week: { type: Number, required: true },
        subscribers: { type: Number, required: true },
        netProfit: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

const StreamingPlatform =
  mongoose.models.StreamingPlatform ||
  mongoose.model("StreamingPlatform", streamingPlatformSchema);

export default StreamingPlatform;
