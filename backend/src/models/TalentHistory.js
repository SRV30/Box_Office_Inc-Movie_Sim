import mongoose from "mongoose";

const talentHistorySchema = new mongoose.Schema({
  gameStateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GameState",
    required: true,
  },
  talentId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["CAREER", "SALARY", "AWARD", "PROGRESSION"],
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

talentHistorySchema.index({ gameStateId: 1, talentId: 1, type: 1 });
talentHistorySchema.index({ gameStateId: 1, createdAt: -1 });

const TalentHistory = mongoose.model("TalentHistory", talentHistorySchema);

export default TalentHistory;
