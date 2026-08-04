import mongoose from "mongoose";

const territoryLicensingSchema = new mongoose.Schema(
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
    },
    region: {
      type: String,
      required: true,
      enum: ["EUROPE", "ASIA_PACIFIC", "LATIN_AMERICA", "MIDDLE_EAST_AFRICA"],
    },
    dealType: {
      type: String,
      enum: ["MINIMUM_GUARANTEE", "REVENUE_SHARE"],
      default: "MINIMUM_GUARANTEE",
    },
    minimumGuaranteePayout: {
      type: Number,
      default: 0,
    },
    revenueSharePercentage: {
      type: Number,
      default: 50,
    },
    dubbingSubtitlingCost: {
      type: Number,
      default: 25000,
    },
    status: {
      type: String,
      enum: ["SIGNED", "EXPIRED"],
      default: "SIGNED",
    },
  },
  { timestamps: true }
);

const TerritoryLicensing = mongoose.model("TerritoryLicensing", territoryLicensingSchema);
export default TerritoryLicensing;
