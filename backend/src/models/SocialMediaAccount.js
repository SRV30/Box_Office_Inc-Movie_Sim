import mongoose from "mongoose";
import { SOCIAL_PLATFORMS } from "../constants/socialPlatforms.js";

/**
 * @fileoverview SocialMediaAccount Model
 *
 * Stores per-platform social media presence for a studio.
 * Kept in a separate collection to avoid unbounded GameState growth.
 */

const activeCampaignSchema = new mongoose.Schema(
  {
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    movieTitle: { type: String, default: "" },
    campaignType: { type: String, required: true },
    startWeek: { type: Number, required: true },
    endWeek: { type: Number, required: true },
    spend: { type: Number, default: 0 },
  },
  { _id: false }
);

const weeklyMetricSchema = new mongoose.Schema(
  {
    week: { type: Number, required: true },
    impressions: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    hypeGenerated: { type: Number, default: 0 },
    sentiment: { type: String, enum: ["positive", "negative", "neutral"], default: "neutral" },
  },
  { _id: false }
);

const socialMediaAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: Object.values(SOCIAL_PLATFORMS),
      required: true,
    },
    followers: { type: Number, default: 0, min: 0 },
    engagementRate: { type: Number, default: 0, min: 0, max: 100 },
    weeklyBudget: { type: Number, default: 0, min: 0 },
    viralMomentum: { type: Number, default: 0, min: 0, max: 100 },
    activeCampaigns: [activeCampaignSchema],
    weeklyMetrics: [weeklyMetricSchema],
  },
  { timestamps: true }
);

socialMediaAccountSchema.index({ userId: 1, platform: 1 }, { unique: true });

const SocialMediaAccount = mongoose.model("SocialMediaAccount", socialMediaAccountSchema);

export default SocialMediaAccount;
