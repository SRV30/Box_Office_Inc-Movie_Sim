import mongoose from "mongoose";

const episodeSchema = new mongoose.Schema(
  {
    episodeNumber: { type: Number, required: true },
    title: { type: String, default: "Untitled Episode" },
    status: {
      type: String,
      enum: ["DEVELOPMENT", "WRITING", "FILMING", "POST_PRODUCTION", "AIRED"],
      default: "DEVELOPMENT",
    },
    quality: { type: Number, default: 50, min: 0, max: 100 },
    viewershipRating: { type: Number, default: 0 }, // Viewers in Millions or Share %
    audienceRetention: { type: Number, default: 90, min: 0, max: 100 },
    advertisingRevenue: { type: Number, default: 0 },
  },
  { _id: true }
);

const seasonSchema = new mongoose.Schema(
  {
    seasonNumber: { type: Number, required: true },
    episodesCount: { type: Number, default: 8, min: 1, max: 24 },
    status: {
      type: String,
      enum: [
        "DEVELOPMENT",
        "WRITING",
        "FILMING",
        "POST_PRODUCTION",
        "AIRING",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "DEVELOPMENT",
    },
    currentAiringEpisode: { type: Number, default: 0 },
    productionWeek: { type: Number, default: 0 },
    productionWeeksRequired: { type: Number, default: 12 },
    budget: { type: Number, default: 1000000 },
    averageViewership: { type: Number, default: 0 },
    criticScore: { type: Number, default: 60, min: 0, max: 100 },
    audienceScore: { type: Number, default: 65, min: 0, max: 100 },
    advertisingRevenue: { type: Number, default: 0 },
    streamingRevenue: { type: Number, default: 0 },
    episodes: [episodeSchema],
    renewalScore: { type: Number, default: 0 },
    renewalVerdict: {
      type: String,
      enum: ["PENDING", "RENEWED", "CANCELLED", "FINAL_SEASON"],
      default: "PENDING",
    },
  },
  { _id: true }
);

const tvShowSchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    genre: {
      type: String,
      default: "Drama",
      trim: true,
    },
    concept: {
      type: String,
      default: "Original scripted series",
    },
    networkOrPlatform: {
      type: String,
      enum: ["Broadcast Network", "Premium Cable", "Streaming Exclusive", "Syndication"],
      default: "Broadcast Network",
    },
    status: {
      type: String,
      enum: [
        "DEVELOPMENT",
        "IN_PRODUCTION",
        "AIRING",
        "RENEWAL_DECISION",
        "COMPLETED",
        "CANCELLED",
        "SYNDICATED",
      ],
      default: "DEVELOPMENT",
    },
    totalSeasonsCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalEpisodesCount: {
      type: Number,
      default: 8,
      min: 1,
    },
    budgetPerEpisode: {
      type: Number,
      default: 250000,
    },
    totalBudget: {
      type: Number,
      default: 2000000,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    totalAdvertisingRevenue: {
      type: Number,
      default: 0,
    },
    totalStreamingRevenue: {
      type: Number,
      default: 0,
    },
    totalSyndicationRevenue: {
      type: Number,
      default: 0,
    },
    quality: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    popularity: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    platformId: {
      type: String,
      default: null,
    },
    cast: [
      {
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketActor" },
        name: { type: String, required: true },
        role: { type: String, default: "Lead" },
        payPerEpisode: { type: Number, default: 25000 },
      },
    ],
    directors: [
      {
        directorId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketDirector" },
        name: { type: String, required: true },
        episodesCount: { type: Number, default: 8 },
      },
    ],
    writers: [
      {
        writerId: { type: mongoose.Schema.Types.ObjectId },
        name: { type: String, required: true },
        role: { type: String, default: "Showrunner" },
      },
    ],
    seasons: [seasonSchema],
    syndicationEligible: {
      type: Boolean,
      default: false,
    },
    isSyndicated: {
      type: Boolean,
      default: false,
    },
    weeklySyndicationRoyalty: {
      type: Number,
      default: 0,
    },
    createdWeek: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const TVShow =
  mongoose.models.TVShow || mongoose.model("TVShow", tvShowSchema);

export default TVShow;
