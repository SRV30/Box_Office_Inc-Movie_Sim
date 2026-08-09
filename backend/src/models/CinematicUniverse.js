import mongoose from "mongoose";

const cinematicUniverseSchema = new mongoose.Schema(
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
      unique: true,
      trim: true,
    },
    phase: {
      type: Number,
      default: 1,
      min: 1,
    },
    sharedFatigueIndex: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    crossoverHypeBonus: {
      type: Number,
      default: 10,
    },
    movies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
      },
    ],
    totalUniverseGross: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "HIATUS", "REBOOTED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

const CinematicUniverse = mongoose.model("CinematicUniverse", cinematicUniverseSchema);
export default CinematicUniverse;
