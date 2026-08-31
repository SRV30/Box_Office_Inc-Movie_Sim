import mongoose from "mongoose";

const merchandiseProductSchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      required: true,
      index: true,
    },
    ipType: {
      type: String,
      enum: ["MOVIE", "TV_SHOW", "FRANCHISE"],
      default: "MOVIE",
    },
    ipId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    ipTitle: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "ACTION_FIGURES_TOYS",
        "APPAREL_CLOTHING",
        "BOOKS_NOVELIZATIONS",
        "LIMITED_COLLECTIBLES",
        "DIGITAL_COSMETICS",
        "SOUNDTRACKS_VINYL",
      ],
      required: true,
    },
    tier: {
      type: String,
      enum: ["MASS_MARKET", "DELUXE", "LIMITED_EDITION", "COLLECTORS_VAULT"],
      default: "MASS_MARKET",
    },
    unitManufacturingCost: {
      type: Number,
      required: true,
      min: 1,
    },
    retailPrice: {
      type: Number,
      required: true,
      min: 1,
    },
    inventoryStock: {
      type: Number,
      default: 10000,
      min: 0,
    },
    totalUnitsProduced: {
      type: Number,
      default: 10000,
    },
    unitsSold: {
      type: Number,
      default: 0,
      min: 0,
    },
    weeklySalesRate: {
      type: Number,
      default: 0,
    },
    totalGrossRevenue: {
      type: Number,
      default: 0,
    },
    totalProductionCost: {
      type: Number,
      default: 0,
    },
    totalNetProfit: {
      type: Number,
      default: 0,
    },
    weeklyStorageFee: {
      type: Number,
      default: 0,
    },
    discountMarkdownPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 80,
    },
    seasonalAffinity: {
      type: String,
      enum: ["YEAR_ROUND", "SUMMER_BLOCKBUSTER", "HOLIDAY_Q4", "BACK_TO_SCHOOL"],
      default: "YEAR_ROUND",
    },
    qualityRating: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SOLD_OUT", "DISCOUNTED", "LIQUIDATED"],
      default: "ACTIVE",
    },
    createdWeek: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

const MerchandiseProduct =
  mongoose.models.MerchandiseProduct ||
  mongoose.model("MerchandiseProduct", merchandiseProductSchema);

export default MerchandiseProduct;
