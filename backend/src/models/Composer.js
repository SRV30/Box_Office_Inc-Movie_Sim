import mongoose from "mongoose";

const composerSchema = new mongoose.Schema(
  {
    studio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatarSeed: {
      type: String,
      default: () => `comp_${Math.floor(Math.random() * 100000)}`,
    },
    age: {
      type: Number,
      required: true,
      min: 18,
      max: 100,
    },
    musicalTalent: {
      type: Number,
      default: 50,
      min: 1,
      max: 100,
    },
    versatility: {
      type: Number,
      default: 50,
      min: 1,
      max: 100,
    },
    popularity: {
      type: Number,
      default: 30,
      min: 1,
      max: 100,
    },
    prestige: {
      type: Number,
      default: 0,
      min: 0,
    },
    salary: {
      type: Number,
      default: 50000,
      min: 5000,
    },
    demand: {
      type: Number,
      default: 1.0,
      min: 0.1,
      max: 10.0,
    },
    genreExpertise: {
      type: [String],
      default: ["Drama", "Sci-Fi"],
    },
    musicStyle: {
      type: String,
      enum: ["Orchestral", "Electronic / Synth", "Acoustic / Minimalist", "Choral Epic", "Jazz & Noir", "Hybrid Modern"],
      default: "Orchestral",
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "UNDER_CONTRACT", "ASSIGNED", "TIRED", "RETIRED"],
      default: "AVAILABLE",
    },
    contractYears: {
      type: Number,
      default: 0,
    },
    busyUntilWeek: {
      type: Number,
      default: 0,
    },
    retiredAtWeek: {
      type: Number,
      default: null,
    },
    scoresComposed: {
      type: Number,
      default: 0,
    },
    hitScores: {
      type: Number,
      default: 0,
    },
    awards: [
      {
        name: String,
        category: String,
        year: Number,
      },
    ],
    lifetimeRoyalties: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

composerSchema.index({ studio: 1, status: 1 });
composerSchema.index({ musicalTalent: -1, popularity: -1 });

const Composer = mongoose.model("Composer", composerSchema);

export default Composer;
