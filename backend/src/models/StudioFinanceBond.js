import mongoose from "mongoose";

const studioFinanceBondSchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      required: true,
      index: true,
    },
    bondType: {
      type: String,
      enum: ["CORPORATE_BOND", "CREDIT_LINE", "HIGH_YIELD_JUNK"],
      default: "CORPORATE_BOND",
    },
    principalAmount: {
      type: Number,
      required: true,
      min: 100000,
    },
    interestRatePercent: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
    },
    durationWeeks: {
      type: Number,
      required: true,
      min: 4,
      max: 104,
    },
    weeksRemaining: {
      type: Number,
      required: true,
    },
    weeklyInterestPayment: {
      type: Number,
      required: true,
    },
    creditRating: {
      type: String,
      enum: ["AAA", "AA", "BBB", "BB", "CCC", "DEFAULT"],
      default: "BBB",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "REPAID", "DEFAULTED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

const StudioFinanceBond = mongoose.model("StudioFinanceBond", studioFinanceBondSchema);
export default StudioFinanceBond;
