import mongoose from "mongoose";

const celebrityScandalSchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      required: true,
      index: true,
    },
    talentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    talentName: {
      type: String,
      required: true,
    },
    talentRole: {
      type: String,
      enum: ["Actor", "Director", "Writer", "Composer"],
      default: "Actor",
    },
    scandalType: {
      type: String,
      enum: [
        "DRUG_USE",
        "AFFAIR",
        "ASSAULT_ALLEGATION",
        "POLITICAL_CONTROVERSY",
        "TAX_FRAUD",
        "LEAKED_VIDEOS",
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    evidenceStatus: {
      type: String,
      enum: ["UNVERIFIED_RUMOR", "LEAKED_EVIDENCE", "VERIFIED_PROOF", "DEBUNKED"],
      default: "UNVERIFIED_RUMOR",
    },
    mediaExposure: {
      type: String,
      enum: [
        "TABLOID_RUMOR",
        "LOCAL_NEWS",
        "VIRAL_SOCIAL",
        "NATIONAL_HEADLINES",
        "GLOBAL_BOYCOTT",
      ],
      default: "LOCAL_NEWS",
    },
    publicOutrage: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    popularityPenalty: {
      type: Number,
      default: 15,
      min: 0,
      max: 100,
    },
    boxOfficeImpactPercent: {
      type: Number,
      default: 10,
      min: 0,
      max: 75,
    },
    reputationDrainPerWeek: {
      type: Number,
      default: 4,
      min: 0,
      max: 25,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "CONTAINED", "RESOLVED", "RECOVERED"],
      default: "ACTIVE",
    },
    activeMovieIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
      },
    ],
    chosenPRStrategy: {
      type: String,
      enum: [
        "NONE",
        "PUBLIC_APOLOGY",
        "CHARITY_DONATION",
        "DEFAMATION_LAWSUIT",
        "PRESS_CONFERENCE",
        "STUDIO_TERMINATION",
        "CRISIS_SETTLEMENT",
      ],
      default: "NONE",
    },
    strategyCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    weeksActive: {
      type: Number,
      default: 0,
    },
    recoveryProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    historyLog: [
      {
        week: { type: Number, default: 0 },
        event: { type: String, required: true },
        sentimentShift: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

const CelebrityScandal =
  mongoose.models.CelebrityScandal ||
  mongoose.model("CelebrityScandal", celebrityScandalSchema);

export default CelebrityScandal;
