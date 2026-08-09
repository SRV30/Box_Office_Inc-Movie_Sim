import StudioFinanceBond from "../models/StudioFinanceBond.js";
import Studio from "../models/Studio.js";
import { calculateCreditRatingAndYield, processWeeklyBondPayments } from "../services/bondMarketEngine.js";

export const evaluateStudioCredit = async (req, res) => {
  try {
    const studioId = req.user.studioId || req.user._id;
    const studio = await Studio.findById(studioId);
    if (!studio) {
      return res.status(404).json({ message: "Studio not found" });
    }

    const activeBonds = await StudioFinanceBond.find({ studioId, status: "ACTIVE" });
    const totalDebt = activeBonds.reduce((acc, b) => acc + b.principalAmount, 0);

    const creditEval = calculateCreditRatingAndYield(studio.balance, totalDebt, studio.prestige || 50);
    return res.status(200).json({ success: true, totalDebt, creditEval });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const issueStudioBond = async (req, res) => {
  try {
    const { principalAmount, durationWeeks, bondType } = req.body;
    const studioId = req.user.studioId || req.user._id;

    const studio = await Studio.findById(studioId);
    if (!studio) {
      return res.status(404).json({ message: "Studio not found" });
    }

    const activeBonds = await StudioFinanceBond.find({ studioId, status: "ACTIVE" });
    const totalDebt = activeBonds.reduce((acc, b) => acc + b.principalAmount, 0);

    const creditEval = calculateCreditRatingAndYield(studio.balance, totalDebt, studio.prestige || 50);
    if (creditEval.creditRating === "CCC" && bondType !== "HIGH_YIELD_JUNK") {
      return res.status(400).json({ message: "Low credit rating requires High Yield Junk bond issuance" });
    }

    const annualRateDecimal = creditEval.interestRatePercent / 100;
    const weeklyInterest = Math.round((principalAmount * annualRateDecimal) / 52);

    const bond = await StudioFinanceBond.create({
      studioId,
      bondType: bondType || "CORPORATE_BOND",
      principalAmount,
      interestRatePercent: creditEval.interestRatePercent,
      durationWeeks,
      weeksRemaining: durationWeeks,
      weeklyInterestPayment: weeklyInterest,
      creditRating: creditEval.creditRating,
    });

    // Credit principal proceeds to studio cash balance
    await Studio.findByIdAndUpdate(studioId, { $inc: { balance: principalAmount } });

    return res.status(201).json({ success: true, bond });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getStudioBonds = async (req, res) => {
  try {
    const studioId = req.user.studioId || req.user._id;
    const bonds = await StudioFinanceBond.find({ studioId });
    return res.status(200).json({ success: true, bonds });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const triggerWeeklyBondProcessing = async (req, res) => {
  try {
    const result = await processWeeklyBondPayments();
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
