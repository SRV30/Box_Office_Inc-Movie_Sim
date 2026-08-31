import mongoose from "mongoose";
import { SOCIAL_PLATFORMS, SOCIAL_EVENT_TYPES } from "../constants/socialPlatforms.js";

/**
 * @fileoverview SocialMediaEvent Model
 *
 * Persists social simulation events separately from GameState.
 * Events are capped per user to prevent unbounded growth.
 */

const socialMediaEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    week: { type: Number, required: true },
    platform: {
      type: String,
      enum: Object.values(SOCIAL_PLATFORMS),
      required: true,
    },
    eventType: {
      type: String,
      enum: Object.values(SOCIAL_EVENT_TYPES),
      required: true,
    },
    sentiment: {
      type: String,
      enum: ["positive", "negative", "neutral"],
      default: "neutral",
    },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
    movieTitle: { type: String, default: "" },
    description: { type: String, required: true },
    hypeDelta: { type: Number, default: 0 },
    reputationDelta: { type: Number, default: 0 },
    viralityScore: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

socialMediaEventSchema.index({ userId: 1, week: -1 });
socialMediaEventSchema.index({ userId: 1, createdAt: -1 });

const SocialMediaEvent = mongoose.model("SocialMediaEvent", socialMediaEventSchema);

export default SocialMediaEvent;
