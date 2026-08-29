import mongoose from "mongoose";

const canonEntrySchema = new mongoose.Schema(
  {
    entryId: { type: mongoose.Schema.Types.ObjectId, required: true },
    entryType: {
      type: String,
      enum: ["MOVIE", "TV_SHOW"],
      default: "MOVIE",
    },
    title: { type: String, required: true },
    timelinePosition: { type: Number, default: 1 }, // Chronological in-universe order
    narrativeType: {
      type: String,
      enum: ["ORIGIN", "SEQUEL", "PREQUEL", "SPIN_OFF", "CROSSOVER_EVENT"],
      default: "SEQUEL",
    },
    phase: { type: Number, default: 1 }, // e.g. Phase 1, Phase 2
    releaseWeek: { type: Number, default: 1 },
    qualityScore: { type: Number, default: 60 },
    worldwideGross: { type: Number, default: 0 },
    loreIntegrityContribution: { type: Number, default: 0 }, // Impact on lore consistency (-15 to +10)
    leadWriterRetained: { type: Boolean, default: true },
  },
  { _id: true }
);

const franchiseUniverseV2Schema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      required: true,
      index: true,
    },
    universeName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "An interconnected cinematic & television narrative universe.",
    },
    tier: {
      type: String,
      enum: [
        "STANDALONE_SERIES",
        "TRILOGY",
        "CINEMATIC_UNIVERSE",
        "MULTI_MEDIA_EMPIRE",
      ],
      default: "CINEMATIC_UNIVERSE",
    },
    loreConsistencyScore: {
      type: Number,
      default: 95,
      min: 0,
      max: 100,
    },
    fatigueScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    universeHypeMultiplier: {
      type: Number,
      default: 1.15,
      min: 0.5,
      max: 3.0,
    },
    fanbaseSize: {
      type: Number,
      default: 1000000,
    },
    fanLoyalty: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
    },
    prestigeLevel: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    totalUniverseGross: {
      type: Number,
      default: 0,
    },
    totalEntriesCount: {
      type: Number,
      default: 0,
    },
    lastReleaseWeek: {
      type: Number,
      default: 0,
    },
    inHiatus: {
      type: Boolean,
      default: false,
    },
    canonTimeline: [canonEntrySchema],
    characterContinuity: [
      {
        characterName: { type: String, required: true },
        actorName: { type: String, required: true },
        appearancesCount: { type: Number, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

const FranchiseUniverseV2 =
  mongoose.models.FranchiseUniverseV2 ||
  mongoose.model("FranchiseUniverseV2", franchiseUniverseV2Schema);

export default FranchiseUniverseV2;
