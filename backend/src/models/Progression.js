import mongoose from "mongoose";

/**
 * @fileoverview Studio Endgame Progression & Achievements Model
 *
 * Stores persistent achievements, studio milestones, Hall of Fame inductees,
 * and endgame legacy telemetry across sessions.
 */

const achievementEntrySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    rarity: { type: String, default: "COMMON" },
    icon: { type: String, default: "Trophy" },
    unlockedAtWeek: { type: Number, default: null },
    unlockedAtDate: { type: Date, default: null },
    isUnlocked: { type: Boolean, default: false },
    progress: { type: Number, default: 0 },
    maxProgress: { type: Number, default: 1 },
  },
  { _id: false }
);

const hallOfFameEntrySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["MOVIE", "TALENT", "STUDIO"], required: true },
    name: { type: String, required: true },
    title: { type: String },
    achievementSummary: { type: String, required: true },
    inductedAtWeek: { type: Number, required: true },
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const progressionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    achievements: [achievementEntrySchema],
    hallOfFame: [hallOfFameEntrySchema],
    milestones: [
      {
        id: String,
        title: String,
        target: Number,
        current: Number,
        achieved: Boolean,
        rewardPrestige: Number,
      },
    ],
    endgameScore: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Progression = mongoose.model("Progression", progressionSchema);

export default Progression;
