import StudioFinanceBond from "../models/StudioFinanceBond.js";
import Studio from "../models/Studio.js";

/**
 * Evaluates studio financial standing and determines credit rating & yield rate
 */
export function calculateCreditRatingAndYield(studioBalance, totalDebt, prestige) {
  const netEquity = studioBalance - totalDebt;
  let rating = "BBB";
  let baseYield = 6.5;

  if (netEquity > 50000000 && prestige >= 80) {
    rating = "AAA";
    baseYield = 3.5;
  } else if (netEquity > 20000000 && prestige >= 60) {
    rating = "AA";
    baseYield = 4.8;
  } else if (netEquity >= 0) {
    rating = "BBB";
    baseYield = 7.0;
  } else if (netEquity > -5000000) {
    rating = "BB";
    baseYield = 12.0;
  } else {
    rating = "CCC";
    baseYield = 18.5;
  }

  return { creditRating: rating, interestRatePercent: baseYield };
}

/**
 * Processes weekly interest coupon payments and bond maturities across active debt instruments
 */
export async function processWeeklyBondPayments() {
  const activeBonds = await StudioFinanceBond.find({ status: "ACTIVE" });
  let totalInterestCollected = 0;

  for (const bond of activeBonds) {
    const studio = await Studio.findById(bond.studioId);
    if (!studio) continue;

    if (studio.balance >= bond.weeklyInterestPayment) {
      studio.balance -= bond.weeklyInterestPayment;
      bond.weeksRemaining -= 1;

      if (bond.weeksRemaining <= 0) {
        if (studio.balance >= bond.principalAmount) {
          studio.balance -= bond.principalAmount;
          bond.status = "REPAID";
        } else {
          bond.status = "DEFAULTED";
          bond.creditRating = "DEFAULT";
        }
      }

      await studio.save();
      await bond.save();
      totalInterestCollected += bond.weeklyInterestPayment;
    } else {
      bond.status = "DEFAULTED";
      bond.creditRating = "DEFAULT";
      await bond.save();
    }
  }

  return { activeBondsCount: activeBonds.length, totalInterestCollected };
}
