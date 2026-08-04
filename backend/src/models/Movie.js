import mongoose from "mongoose";
import { VERDICT_LIST } from "../constants/verdicts.js";

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: "Studio", required: true },
    scriptId: { type: String, required: true },
    directorId: { type: String, required: true },
    directorName: { type: String, default: "" },
    leadActorId: { type: String, required: true },
    leadActorName: { type: String, default: "" },
    supportingActorIds: [{ type: String }],
    crewTeamId: { type: String, required: true },
    crewTeamName: { type: String, default: "" },

    budget: { type: Number, default: 0 },
    marketingBudget: { type: Number, default: 0 },
    marketingCampaigns: [{ type: String }],

    quality: { type: Number, default: 0 },
    hype: { type: Number, default: 0 },

    criticScore: { type: Number, default: 0 },
    criticLabel: { type: String, default: "" },
    audienceScore: { type: Number, default: 0 },
    audienceLabel: { type: String, default: "Mixed" },
    merchandiseLevel: { type: Number, default: 0 },
    merchandiseRevenue: { type: Number, default: 0 },

    boxOffice: { type: Number, default: 0 }, // Worldwide Gross
    openingWeekend: { type: Number, default: 0 },
    domesticGross: { type: Number, default: 0 },
    internationalGross: { type: Number, default: 0 },
    worldwideGross: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    roi: { type: Number, default: 0 },
    verdict: { type: String, enum: [...VERDICT_LIST, "N/A"], default: "N/A" },

    status: {
      type: String,
      enum: ["PLANNING", "PRE_PRODUCTION", "PRODUCTION", "POST_PRODUCTION", "READY_FOR_RELEASE", "RELEASED", "RELEASED_STREAMING"],
      default: "PLANNING",
    },

    releaseType: { type: String, enum: ['THEATRICAL', 'STREAMING'], default: 'THEATRICAL' },
    streamingDeal: {
      platformId: String,
      dealValue: { type: Number, min: 0 },
      exclusiveWeeks: { type: Number, min: 0 },
      status: { type: String, enum: ['OFFERED', 'ACCEPTED', 'REJECTED'] }
    },

    createdWeek: { type: Number, required: true },
    releaseWeek: { type: Number, default: null },
    scheduledReleaseWeek: { type: Number, default: null },
    clashPenaltyApplied: { type: Boolean, default: false },
    productionProgress: { type: Number, default: 0 },
    remainingWeeks: { type: Number, default: 0 },

    budgetBreakdown: {
        scriptCost: { type: Number, default: 0 },
        directorCost: { type: Number, default: 0 },
        leadActorCost: { type: Number, default: 0 },
        supportingActorCost: { type: Number, default: 0 },
        crewCost: { type: Number, default: 0 },
        marketingCost: { type: Number, default: 0 },
    },

    // Track weeks in each stage
    weeksInStage: { type: Number, default: 0 },

    // Franchise and Sequel details
    franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: "Franchise", default: null },
    installmentNumber: { type: Number, default: 1 },
    movieType: {
      type: String,
      enum: ["Standalone", "Sequel", "Prequel", "Spin-off", "Reboot"],
      default: "Standalone",
    },
    sequelNumber: { type: Number, default: 1 },
// Awards tracking
    awards: [{
      name: String,
      category: String,
      year: Number
    }],
    // Production event tracking
    delayWeeks: { type: Number, default: 0 },
    events: [{
      eventId: String,
      label: String,
      message: String,
      week: Number,
    }],
    // Soundtracks and Music Licensing (issue #286)
    soundtrackTier: {
      type: String,
      enum: ["PUBLIC_DOMAIN", "INDIE", "PREMIUM"],
      default: "PUBLIC_DOMAIN",
    },
    soundtrackRevenue: { type: Number, default: 0 },
    
    // Co-productions and Distribution Partnerships (issue #287)
    coProducerStudioId: { type: String, default: null },
    coProducerShare: { type: Number, default: 0 },

    // Re-release and Director's Cut support (issue #283)
    isReRelease: { type: Boolean, default: false },
    reReleaseWeek: { type: Number, default: null },
    directorCutQualityBoost: { type: Number, default: 0 },
    reReleaseRevenue: { type: Number, default: 0 },

    // Test screenings & script doctoring (issue #288)
    testScreeningScore: { type: Number, default: null },
    reshoots: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index: simulation queries filter by studioId + status (issue #398)
movieSchema.index({ studioId: 1, status: 1 });

movieSchema.virtual("totalGross").get(function () {
  return this.boxOffice;
});

movieSchema.set("toJSON", { virtuals: true });
movieSchema.set("toObject", { virtuals: true });

const Movie = mongoose.model("Movie", movieSchema);

export default Movie;
