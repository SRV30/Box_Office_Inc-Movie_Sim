import mongoose from "mongoose";

const aiStudioStrategyV2Schema = new mongoose.Schema(
  {
    gameStateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameState",
      required: true,
      index: true,
    },
    rivalStudioId: {
      type: String,
      required: true,
      index: true,
    },
    studioName: {
      type: String,
      required: true,
    },
    strategyType: {
      type: String,
      enum: ["BLOCKBUSTER_FACTORY", "INDIE_DARLING", "AWARD_HUNTER", "FRANCHISE_BUILDER", "STREAMING_GIANT"],
      required: true,
    },
    multiYearPlan: {
      targetMarketShare: { type: Number, default: 20 },
      plannedProjectsCount: { type: Number, default: 5 },
      focusGenres: [String],
      riskTolerance: {
        type: String,
        enum: ["LOW", "MODERATE", "HIGH", "EXTREME"],
        default: "MODERATE",
      },
    },
    budgetAllocation: {
      productionShare: { type: Number, default: 0.6 },
      marketingShare: { type: Number, default: 0.25 },
      streamingShare: { type: Number, default: 0.15 },
    },
    longTermMemory: {
      pastFlopsCount: { type: Number, default: 0 },
      pastHitsCount: { type: Number, default: 0 },
      learnedGenreModifiers: { type: Map, of: Number, default: {} },
    },
    relationships: [
      {
        competitorStudioId: String,
        sentiment: { type: Number, default: 50 }, // 0 to 100
      },
    ],
  },
  { timestamps: true }
);

aiStudioStrategyV2Schema.index({ gameStateId: 1, rivalStudioId: 1 }, { unique: true });

const AIStudioStrategyV2 = mongoose.model("AIStudioStrategyV2", aiStudioStrategyV2Schema);
export default AIStudioStrategyV2;
