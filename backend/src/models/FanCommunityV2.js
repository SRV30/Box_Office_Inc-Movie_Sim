import mongoose from "mongoose";

const fanCommunityV2Schema = new mongoose.Schema(
  {
    gameStateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameState",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["ACTOR", "MOVIE", "FRANCHISE", "TV_SHOW"],
      required: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    targetName: {
      type: String,
      required: true,
    },
    fanClubName: {
      type: String,
      required: true,
    },
    memberCount: {
      type: Number,
      default: 1000,
    },
    loyaltyScore: {
      type: Number,
      default: 50, // 0 to 100
    },
    sentimentScore: {
      type: Number,
      default: 75, // 0 to 100
    },
    activeFanTheories: [
      {
        id: String,
        title: String,
        description: String,
        virality: { type: Number, default: 50 },
        createdWeek: Number,
      },
    ],
    reviewBombingState: {
      isReviewBombing: { type: Boolean, default: false },
      campaignType: {
        type: String,
        enum: ["HATE_CAMPAIGN", "PRAISE_CAMPAIGN", "NONE"],
        default: "NONE",
      },
      triggerReason: String,
      intensityMultiplier: { type: Number, default: 1.0 },
      startWeek: Number,
    },
  },
  { timestamps: true }
);

fanCommunityV2Schema.index({ gameStateId: 1, targetType: 1, targetId: 1 }, { unique: true });

const FanCommunityV2 = mongoose.model("FanCommunityV2", fanCommunityV2Schema);
export default FanCommunityV2;
