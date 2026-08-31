import mongoose from "mongoose";

const awardCeremonyV2Schema = new mongoose.Schema(
  {
    gameStateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameState",
      required: true,
      index: true,
    },
    ceremonyKey: {
      type: String,
      required: true,
      enum: ["GLOBAL_ACADEMY", "INTERNATIONAL_GOLDEN_GLOBE", "DOMESTIC_GUILD", "NATIONAL_INDIE_SPIRIT"],
    },
    name: {
      type: String,
      required: true,
    },
    scope: {
      type: String,
      enum: ["GLOBAL", "INTERNATIONAL", "DOMESTIC", "NATIONAL"],
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    weekHeld: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["UPCOMING", "SUBMISSIONS_OPEN", "NOMINATIONS_ANNOUNCED", "COMPLETED"],
      default: "UPCOMING",
    },
    juries: [
      {
        id: String,
        name: String,
        bias: {
          type: String,
          enum: ["ARTISTIC_AUTEUR", "COMMERCIAL_BOX_OFFICE", "STAR_POWER", "BALANCED", "CRITIC_DARLING"],
          default: "BALANCED",
        },
        votingWeight: { type: Number, default: 1.0 },
      },
    ],
    categories: [
      {
        categoryKey: String,
        categoryName: String,
        submissions: [
          {
            movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
            movieTitle: String,
            studioId: { type: mongoose.Schema.Types.ObjectId, ref: "Studio" },
            studioName: String,
            talentId: String,
            talentName: String,
            score: Number,
            fycSpent: { type: Number, default: 0 },
            isNominated: { type: Boolean, default: false },
            isWinner: { type: Boolean, default: false },
          },
        ],
        nominations: [
          {
            movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
            movieTitle: String,
            studioId: { type: mongoose.Schema.Types.ObjectId, ref: "Studio" },
            studioName: String,
            talentId: String,
            talentName: String,
            votesReceived: Number,
          },
        ],
        winner: {
          movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
          movieTitle: String,
          studioId: { type: mongoose.Schema.Types.ObjectId, ref: "Studio" },
          studioName: String,
          talentId: String,
          talentName: String,
          prestigeAwarded: Number,
        },
      },
    ],
    prestigeMultiplier: {
      type: Number,
      default: 1.0,
    },
  },
  { timestamps: true }
);

awardCeremonyV2Schema.index({ gameStateId: 1, year: 1, ceremonyKey: 1 }, { unique: true });

const AwardCeremonyV2 = mongoose.model("AwardCeremonyV2", awardCeremonyV2Schema);
export default AwardCeremonyV2;
