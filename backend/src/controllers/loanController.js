/**
 * @fileoverview Loan Controller
 *
 * Handles corporate loan management for studios (issue #195).
 *
 * Loan tiers:
 *  - SMALL:  $500,000  at 8% annual interest over 26 weeks
 *  - MEDIUM: $1,000,000 at 12% annual interest over 52 weeks
 *  - LARGE:  $2,000,000 at 18% annual interest over 78 weeks
 *
 * Weekly repayment = (principal + totalInterest) / weeksRemaining
 * Interest is pre-calculated and factored into repayment from the start.
 */

import Studio from "../models/Studio.js";
import GameState from "../models/GameState.js";
import env from "../config/envConfig.js";

const LOAN_TIERS = {
  SMALL: {
    amount: 500_000,
    interestRate: 0.08,
    weeks: 26,
  },
  MEDIUM: {
    amount: 1_000_000,
    interestRate: 0.12,
    weeks: 52,
  },
  LARGE: {
    amount: 2_000_000,
    interestRate: 0.18,
    weeks: 78,
  },
};

/**
 * POST /api/studios/loans/take
 *
 * Request body: { tier: "SMALL" | "MEDIUM" | "LARGE" }
 */
export const takeLoan = async (req, res) => {
  try {
    const { tier } = req.body;

    if (!tier || typeof tier !== "string") {
      return res.status(400).json({
        success: false,
        message: "Loan tier is required and must be a string.",
      });
    }

    const normalizedTier = tier.toUpperCase();
    if (!LOAN_TIERS[normalizedTier]) {
      return res.status(400).json({
        success: false,
        message: `Invalid loan tier. Choose one of: ${Object.keys(LOAN_TIERS).join(", ")}`,
      });
    }

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) return res.status(404).json({ success: false, message: "Studio not found" });

    if (studio.isBankrupt) {
      return res.status(400).json({ success: false, message: "Bankrupt studios cannot take new loans." });
    }

    if (studio.negativeCashWeeks >= 2) {
      return res.status(400).json({
        success: false,
        message: `Studio has been in negative balance for ${studio.negativeCashWeeks} weeks. Resolve financial distress before taking new loans.`,
      });
    }

    if ((studio.loans || []).length >= env.MAX_ACTIVE_LOANS) {
      return res.status(400).json({ success: false, message: `Maximum of ${env.MAX_ACTIVE_LOANS} active loans allowed at one time.` });
    }

    const gameState = await GameState.findOne({ user: req.user._id });
    if (!gameState) return res.status(404).json({ success: false, message: "Game state not found" });

    const loanConfig = LOAN_TIERS[normalizedTier];
    const totalInterest = loanConfig.amount * loanConfig.interestRate * (loanConfig.weeks / 52);
    const totalRepayment = loanConfig.amount + totalInterest;
    const weeklyRepayment = Math.ceil(totalRepayment / loanConfig.weeks);

    const totalWeeklyDebt = (studio.loans || []).reduce((sum, l) => sum + l.weeklyRepayment, 0);
    const newTotalDebt = totalWeeklyDebt + weeklyRepayment;

    if (newTotalDebt > studio.money * 0.5 && studio.money > 0) {
      return res.status(400).json({
        success: false,
        message: "This loan would make your weekly debt payments exceed 50% of current balance. Reduce existing loans first.",
      });
    }

    studio.loans.push({
      amount: loanConfig.amount,
      interestRate: loanConfig.interestRate,
      weeklyRepayment,
      weeksRemaining: loanConfig.weeks,
      takenWeek: gameState.currentWeek,
    });

    studio.money += loanConfig.amount;
    await studio.save();

    res.status(201).json({
      success: true,
      message: `Loan of $${loanConfig.amount.toLocaleString()} approved at ${(loanConfig.interestRate * 100).toFixed(0)}% annual interest. Weekly repayment: $${weeklyRepayment.toLocaleString()}.`,
      weeklyRepayment,
      weeksRemaining: loanConfig.weeks,
      newBalance: studio.money,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/studios/loans
 *
 * Returns all active loans for the studio.
 */
export const getLoans = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id }).select("loans money isBankrupt negativeCashWeeks").lean();
    if (!studio) return res.status(404).json({ success: false, message: "Studio not found" });

    const totalWeeklyDebt = (studio.loans || []).reduce((sum, l) => sum + l.weeklyRepayment, 0);

    res.status(200).json({
      success: true,
      loans: studio.loans || [],
      totalWeeklyDebt,
      isBankrupt: studio.isBankrupt || false,
      negativeCashWeeks: studio.negativeCashWeeks || 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/studios/loans/:loanId/repay
 *
 * Early payoff of an active loan. Deducts remaining installments
 * from studio funds and immediately closes out the debt obligation.
 */
export const repayLoanEarly = async (req, res) => {
  try {
    const { loanId } = req.params;
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const loanIndex = (studio.loans || []).findIndex(
      (l) => String(l._id) === String(loanId)
    );

    if (loanIndex === -1) {
      return res.status(404).json({ success: false, message: "Active loan not found" });
    }

    const loan = studio.loans[loanIndex];
    const payoffAmount = loan.weeklyRepayment * loan.weeksRemaining;

    if (studio.money < payoffAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Early payoff requires $${payoffAmount.toLocaleString()}, but studio balance is $${studio.money.toLocaleString()}.`,
        requiredAmount: payoffAmount,
        studioBalance: studio.money,
      });
    }

    studio.money -= payoffAmount;
    studio.loans.splice(loanIndex, 1);

    if (studio.money >= 0) {
      studio.negativeCashWeeks = 0;
      if (studio.isBankrupt && studio.money > 0) {
        studio.isBankrupt = false;
      }
    }

    await studio.save();

    return res.status(200).json({
      success: true,
      message: `Successfully paid off loan early for $${payoffAmount.toLocaleString()}.`,
      paidAmount: payoffAmount,
      remainingLoans: studio.loans,
      newBalance: studio.money,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
