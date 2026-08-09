import mongoose from "mongoose";

const streamingAuctionSchema = new mongoose.Schema(
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
    windowType: {
      type: String,
      enum: ["EXCLUSIVE_DAY_DATE", "POST_THEATRICAL_SVOD", "GLOBAL_PREMIERE"],
      default: "POST_THEATRICAL_SVOD",
    },
    askingPrice: {
      type: Number,
      required: true,
      min: 50000,
    },
    winningPlatform: {
      type: String,
      enum: ["NetCinema", "StreamMax", "CineStream", "PrimePlay", "PENDING"],
      default: "PENDING",
    },
    winningBidAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["OPEN", "COMPLETED", "EXPIRED"],
      default: "OPEN",
    },
    bids: [
      {
        platform: { type: String, required: true },
        amount: { type: Number, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const StreamingAuction = mongoose.model("StreamingAuction", streamingAuctionSchema);
export default StreamingAuction;
