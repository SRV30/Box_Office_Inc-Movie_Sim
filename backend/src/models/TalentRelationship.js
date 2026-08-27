import mongoose from "mongoose";

/**
 * @fileoverview TalentRelationship Model
 *
 * Stores persistent, independent relationships between actors/directors/talent
 * (Friendships, Rivalries, Mentorships, Romantic relationships, Breakups).
 * Prevents GameState unbounded growth and enables relationship history and queries.
 */

export const RELATIONSHIP_TYPES = {
  FRIENDSHIP: "FRIENDSHIP",
  RIVALRY: "RIVALRY",
  MENTORSHIP: "MENTORSHIP",
  ROMANTIC: "ROMANTIC",
  BREAKUP: "BREAKUP",
  NEUTRAL: "NEUTRAL",
};

const talentRelationshipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    talentAId: {
      type: String,
      required: true,
      index: true,
    },
    talentAName: {
      type: String,
      default: "",
    },
    talentBId: {
      type: String,
      required: true,
      index: true,
    },
    talentBName: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: Object.values(RELATIONSHIP_TYPES),
      default: RELATIONSHIP_TYPES.NEUTRAL,
      required: true,
    },
    strength: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    chemistryModifier: {
      type: Number,
      default: 0, // Quality percentage delta (-15% to +20%)
    },
    audienceInterestModifier: {
      type: Number,
      default: 0, // Box office / hype multiplier bonus (-0.1 to +0.25)
    },
    coStarMoviesCount: {
      type: Number,
      default: 0,
    },
    lastCollaboratedWeek: {
      type: Number,
      default: 0,
    },
    history: [
      {
        week: Number,
        event: String,
        details: String,
        delta: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Compound index for querying relationship between any pair
talentRelationshipSchema.index({ userId: 1, talentAId: 1, talentBId: 1 }, { unique: true });
talentRelationshipSchema.index({ userId: 1, type: 1 });

const TalentRelationship = mongoose.model("TalentRelationship", talentRelationshipSchema);

export default TalentRelationship;
