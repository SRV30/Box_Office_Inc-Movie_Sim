import mongoose from "mongoose";

export const FINANCIAL_CATEGORIES = [
  "PRODUCTION",
  "MARKETING",
  "PAYROLL",
  "BOX_OFFICE",
  "STREAMING",
  "BOND",
  "MERCHANDISE",
  "TERRITORY",
  "INSURANCE",
  "FESTIVAL",
  "LOAN",
  "OTHER",
];

export const FINANCIAL_DIRECTIONS = ["CREDIT", "DEBIT"];

const FinancialLedgerEntrySchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    direction: {
      type: String,
      enum: FINANCIAL_DIRECTIONS,
      required: true,
    },
    category: {
      type: String,
      enum: FINANCIAL_CATEGORIES,
      default: "OTHER",
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    gameWeek: {
      type: Number,
      required: true,
      min: 1,
    },
    runningBalance: {
      type: Number,
      default: null,
    },
    relatedEntityId: {
      type: String,
      default: null,
      trim: true,
    },
    relatedEntityType: {
      type: String,
      default: null,
      trim: true,
    },
    isReversal: {
      type: Boolean,
      default: false,
    },
    reversalForEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinancialLedgerEntry",
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable ledger records
  }
);

// Compound indexes for quick player querying and chronological sorting
FinancialLedgerEntrySchema.index({ studioId: 1, gameWeek: -1, createdAt: -1 });
FinancialLedgerEntrySchema.index({ studioId: 1, category: 1 });
FinancialLedgerEntrySchema.index({ studioId: 1, direction: 1 });

const FinancialLedgerEntry = mongoose.model(
  "FinancialLedgerEntry",
  FinancialLedgerEntrySchema
);

export default FinancialLedgerEntry;
