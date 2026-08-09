import mongoose from "mongoose";

const awardsCampaignSchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      required: true,
      index: true,
    },
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["BEST_PICTURE", "BEST_DIRECTOR", "BEST_ACTOR", "BEST_ORIGINAL_SCREENPLAY", "BEST_VFX"],
    },
    campaignBudget: {
      type: Number,
      required: true,
      min: 10000,
    },
    fycScreeningsHeld: {
      type: Number,
      default: 0,
    },
    voterSentimentScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    nominationStatus: {
      type: String,
      enum: ["PENDING", "NOMINATED", "WINNER", "NOT_NOMINATED"],
      default: "PENDING",
    },
    postWinBoxOfficeBoost: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const AwardsCampaign = mongoose.model("AwardsCampaign", awardsCampaignSchema);
export default AwardsCampaign;
