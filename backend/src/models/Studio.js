import mongoose from "mongoose";

const studioSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    money: {
      type: Number,
      default: 10000000,
    },

    prestige: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    fans: {
      type: Number,
      default: 0,
      min: 0,
    },

    studioLevel: {
      type: Number,
      default: 1,
      min: 1,
    },

    highestGrossingMovie: {
        id: String,
        title: String,
        amount: Number
    },
    mostProfitableMovie: {
        id: String,
        title: String,
        amount: Number
    },
    bestReviewedMovie: {
        id: String,
        title: String,
        amount: Number
    },

    stats: {
        moviesReleased: { type: Number, default: 0 },
        hits: { type: Number, default: 0 },
        blockbusters: { type: Number, default: 0 },
        allTimeBlockbusters: { type: Number, default: 0 },
        flops: { type: Number, default: 0 },
        disasters: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        totalProfit: { type: Number, default: 0 },
        avgCriticScore: { type: Number, default: 0 },
        avgAudienceScore: { type: Number, default: 0 },
        awardsWon: { type: Number, default: 0 }
    },

    financialHistory: [{
        week: Number,
        year: Number,
        revenue: Number,
        expenses: Number,
        payroll: Number,
        movieCosts: Number,
        marketingCosts: Number,
        profit: Number,
        balance: Number
    }],

    seasonStats: [{ type: Object }], // For leaderboard snapshotting
    
    merchandiseIncomeHistory: [
      {
        week: { type: Number, required: true },
        amount: { type: Number, required: true },
        reason: { type: String, default: "Weekly Merchandise Sales" },
      }
    ],

    // Corporate Loans (issue #195)
    loans: [
      {
        amount: { type: Number, required: true },
        interestRate: { type: Number, required: true }, // annual rate e.g. 0.12 = 12%
        weeklyRepayment: { type: Number, required: true },
        weeksRemaining: { type: Number, required: true },
        takenWeek: { type: Number, required: true },
      }
    ],
    negativeCashWeeks: { type: Number, default: 0 },
    isBankrupt: { type: Boolean, default: false },

    // Fan Club & Conventions (issue #284)
    fanClub: {
      weeklyBudget: { type: Number, default: 0 },
      totalFans: { type: Number, default: 0 },
      lastConventionWeek: { type: Number, default: null }
    },
    
    // PR & Scandal Management (issue #281)
    reputation: { type: Number, default: 100, min: 0, max: 100 },
    activeScandals: [{
      description: { type: String },
      week: { type: Number },
      reputationImpact: { type: Number },
    }],
  // Pre-Sales Campaigns (issue #347)
  preSalesCampaigns: [{
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
    budget: { type: Number, default: 0 },
    preSalesRevenue: { type: Number, default: 0 },
    startWeek: { type: Number },
    active: { type: Boolean, default: true }
  }],
},
{
    timestamps: true,
  }
);

const Studio = mongoose.model("Studio", studioSchema);

export default Studio;
