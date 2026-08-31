import mongoose from "mongoose";

/**
 * Tracks exclusive streaming rights to prevent conflicting assignments (issue #546).
 */
const streamingRightsSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: ["MOVIE", "TV"],
      default: "MOVIE",
    },
    contentTitle: { type: String, default: "" },
    platformId: { type: String, required: true, index: true },
    platformName: { type: String, default: "" },
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      required: true,
      index: true,
    },
    bidAmount: { type: Number, required: true, min: 0 },
    windowType: {
      type: String,
      enum: ["EXCLUSIVE_DAY_DATE", "POST_THEATRICAL_SVOD", "GLOBAL_PREMIERE"],
      default: "POST_THEATRICAL_SVOD",
    },
    exclusivityWeeks: { type: Number, default: 52 },
    startWeek: { type: Number, required: true },
    endWeek: { type: Number, required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

streamingRightsSchema.index({ contentId: 1, contentType: 1, status: 1 }, { unique: true, partialFilterExpression: { status: "ACTIVE" } });

const StreamingRights = mongoose.model("StreamingRights", streamingRightsSchema);
export default StreamingRights;
