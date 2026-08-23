import mongoose from "mongoose";

const pastAwardSchema = new mongoose.Schema(
  {
    gameStateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameState",
      required: true,
      index: true,
    },
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    bestPictureId: {
      type: String,
    },
    bestPictureTitle: {
      type: String,
    },
    bestDirectorId: {
      type: String,
    },
    bestDirectorName: {
      type: String,
      default: "Unknown Director",
    },
    bestActorId: {
      type: String,
    },
    bestActorName: {
      type: String,
      default: "Unknown Actor",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying past awards by gameState in order
pastAwardSchema.index({ gameStateId: 1, year: -1 });

const PastAward = mongoose.model("PastAward", pastAwardSchema);

export default PastAward;
