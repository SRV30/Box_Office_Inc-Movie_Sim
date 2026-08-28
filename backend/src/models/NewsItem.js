import mongoose from "mongoose";
import { NEWS_CATEGORIES, NEWS_REGIONS, NEWS_SENTIMENTS } from "../constants/newsMedia.js";

const entityLinkSchema = new mongoose.Schema(
  {
    entityType: { type: String, required: true },
    entityId: { type: String, default: "" },
    entityName: { type: String, default: "" },
  },
  { _id: false }
);

const newsItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(NEWS_CATEGORIES),
      required: true,
    },
    headline: { type: String, required: true },
    body: { type: String, required: true },
    week: { type: Number, required: true },
    publishedWeek: { type: Number, required: true },

    studioId: { type: mongoose.Schema.Types.ObjectId, ref: "Studio", default: null },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", default: null },
    talentId: { type: String, default: null },
    franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: "Franchise", default: null },

    source: {
      id: { type: String, default: "CINEVERSE_WIRE" },
      name: { type: String, default: "CineVerse Wire" },
      credibility: { type: Number, default: 65, min: 0, max: 100 },
    },
    sentiment: {
      type: String,
      enum: Object.values(NEWS_SENTIMENTS),
      default: NEWS_SENTIMENTS.NEUTRAL,
    },
    reach: { type: Number, default: 50, min: 0, max: 100 },
    region: {
      type: String,
      enum: Object.values(NEWS_REGIONS),
      default: NEWS_REGIONS.GLOBAL,
    },

    dedupeKey: { type: String, default: null, sparse: true },
    triggerEvent: { type: String, default: "" },
    socialAmplified: { type: Boolean, default: false },

    hypeEffect: { type: Number, default: 0 },
    reputationEffect: { type: Number, default: 0 },

    entityLinks: [entityLinkSchema],
  },
  { timestamps: true }
);

newsItemSchema.index({ type: 1, week: -1 });
newsItemSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });
newsItemSchema.index({ studioId: 1, week: -1 });
newsItemSchema.index({ sentiment: 1, week: -1 });

const NewsItem = mongoose.model("NewsItem", newsItemSchema);
export default NewsItem;
