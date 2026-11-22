import StudioFinanceBond from "../models/StudioFinanceBond.js";
import Studio from "../models/Studio.js";
import { calculateCreditRatingAndYield, processWeeklyBondPayments } from "../services/bondMarketEngine.js";
import { withTransaction } from "../utils/financeTransactionHelper.js";

const getStudioId = async (user) => {
  if (user.studioId) return user.studioId;
  const s = await Studio.findOne({ owner: user._id });
  return s?._id || user._id;
};

export const evaluateStudioCredit = async (req, res) => {
  try {
    const studioId = await getStudioId(req.user);
    const studio = await Studio.findById(studioId);
    if (!studio) {
      return res.status(404).json({ message: "Studio not found" });
    }

    const activeBonds = await StudioFinanceBond.find({ studioId, status: "ACTIVE" });
    const totalDebt = activeBonds.reduce((acc, b) => acc + b.principalAmount, 0);

    const creditEval = calculateCreditRatingAndYield(studio.money, totalDebt, studio.prestige || 50);
    return res.status(200).json({ success: true, totalDebt, creditEval });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const issueStudioBond = async (req, res) => {
  try {
    const { principalAmount, durationWeeks, bondType } = req.body;
    const studioId = await getStudioId(req.user);

    const studio = await Studio.findById(studioId);
    if (!studio) {
      return res.status(404).json({ message: "Studio not found" });
    }

    const activeBonds = await StudioFinanceBond.find({ studioId, status: "ACTIVE" });
    const totalDebt = activeBonds.reduce((acc, b) => acc + b.principalAmount, 0);

    const creditEval = calculateCreditRatingAndYield(studio.money, totalDebt, studio.prestige || 50);
    if (creditEval.creditRating === "CCC" && bondType !== "HIGH_YIELD_JUNK") {
      return res.status(400).json({ message: "Low credit rating requires High Yield Junk bond issuance" });
    }

    const annualRateDecimal = creditEval.interestRatePercent / 100;
    const weeklyInterest = Math.round((principalAmount * annualRateDecimal) / 52);

    let createdBond = null;

    await withTransaction(async (session) => {
      const [bond] = await StudioFinanceBond.create(
        [
          {
            studioId,
            bondType: bondType || "CORPORATE_BOND",
            principalAmount,
            interestRatePercent: creditEval.interestRatePercent,
            durationWeeks,
            weeksRemaining: durationWeeks,
            weeklyInterestPayment: weeklyInterest,
            creditRating: creditEval.creditRating,
          },
        ],
        { session }
      );

      // Atomically credit principal proceeds to the canonical Studio.money field
      await Studio.findByIdAndUpdate(
        studioId,
        { $inc: { money: principalAmount } },
        { session, new: true }
      );

      createdBond = bond;
    });

    return res.status(201).json({ success: true, bond: createdBond });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getStudioBonds = async (req, res) => {
  try {
    const studioId = await getStudioId(req.user);
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
