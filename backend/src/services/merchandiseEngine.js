import MerchandiseDeal from "../models/MerchandiseDeal.js";
import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";

/**
 * Calculates advance royalty and projected sales parameters based on movie tier & category
 */
export function calculateMerchandiseValuation(movie, category, tier) {
  const baseValuation = (movie.boxOfficeTotal || movie.budget || 1000000) * 0.05;
  const qualityFactor = Math.max(0.5, (movie.rating || 50) / 50);

  const tierMultipliers = {
    STANDARD: 1.0,
    PREMIUM: 1.8,
    GLOBAL_EXCLUSIVE: 3.2,
  };

  const categoryMultipliers = {
    ACTION_FIGURES: 1.5,
    APPAREL: 1.0,
    COLLECTIBLES: 2.0,
    DIGITAL_ITEMS: 1.2,
    SOUNDTRACK_VINYL: 0.8,
  };

  const mult = (tierMultipliers[tier] || 1.0) * (categoryMultipliers[category] || 1.0);
  const advanceRoyalty = Math.round(baseValuation * qualityFactor * mult * 0.15);
  const royaltyPercentage = tier === "GLOBAL_EXCLUSIVE" ? 25 : tier === "PREMIUM" ? 18 : 12;
  const inventoryUnits = Math.round(5000 * qualityFactor * mult);

  return {
    advanceRoyalty,
    royaltyPercentage,
    inventoryUnits,
  };
}

/**
 * Processes weekly merchandise sales across active merchandise deals
 */
export async function processWeeklyMerchandiseSales() {
  const activeDeals = await MerchandiseDeal.find({ status: "ACTIVE" }).populate("movieId");
  let totalProcessedRevenue = 0;

  for (const deal of activeDeals) {
    if (!deal.movieId) continue;

    const remainingInventory = deal.inventoryUnits - deal.unitsSold;
    if (remainingInventory <= 0) {
      deal.status = "SOLD_OUT";
      await deal.save();
      continue;
    }

    const movieQuality = deal.movieId.rating || 50;
    const baseWeeklyUnits = Math.round((movieQuality * 15) + Math.random() * 50);
    const unitsToSell = Math.min(remainingInventory, baseWeeklyUnits);

    if (unitsToSell > 0) {
      const pricePerUnit = deal.category === "COLLECTIBLES" ? 80 : deal.category === "ACTION_FIGURES" ? 35 : 25;
      const grossSales = unitsToSell * pricePerUnit;
      const studioRoyaltyCut = Math.round(grossSales * (deal.royaltyPercentage / 100));

      deal.unitsSold += unitsToSell;
      deal.weeklySalesRate = unitsToSell;
      deal.totalRevenueGenerated += studioRoyaltyCut;
      deal.weeksActive += 1;

      if (deal.unitsSold >= deal.inventoryUnits) {
        deal.status = "SOLD_OUT";
      }

      await deal.save();

      // Add earnings to studio money
      await Studio.findByIdAndUpdate(deal.studioId, {
        $inc: { money: studioRoyaltyCut },
      });

      totalProcessedRevenue += studioRoyaltyCut;
    }
  }

  return { activeDealsCount: activeDeals.length, totalProcessedRevenue };
}
