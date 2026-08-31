/**
 * @fileoverview Complete Merchandise Economy Simulation Engine
 * Handles IP product creation, seasonal demand curves, inventory tracking,
 * price elasticity, clearance markdowns, warehouse storage fees, and liquidation.
 */

export const CATEGORY_CONFIGS = {
  ACTION_FIGURES_TOYS: {
    baseCost: 8,
    suggestedRetail: 29.99,
    baseDemand: 1500,
    storageCostPerUnit: 0.12,
  },
  APPAREL_CLOTHING: {
    baseCost: 6,
    suggestedRetail: 24.99,
    baseDemand: 2200,
    storageCostPerUnit: 0.08,
  },
  BOOKS_NOVELIZATIONS: {
    baseCost: 4,
    suggestedRetail: 18.99,
    baseDemand: 1200,
    storageCostPerUnit: 0.06,
  },
  LIMITED_COLLECTIBLES: {
    baseCost: 35,
    suggestedRetail: 149.99,
    baseDemand: 450,
    storageCostPerUnit: 0.25,
  },
  DIGITAL_COSMETICS: {
    baseCost: 1,
    suggestedRetail: 9.99,
    baseDemand: 3500,
    storageCostPerUnit: 0.0, // No warehouse cost
  },
  SOUNDTRACKS_VINYL: {
    baseCost: 9,
    suggestedRetail: 34.99,
    baseDemand: 900,
    storageCostPerUnit: 0.10,
  },
};

/**
 * Calculates seasonal demand multiplier for a given simulation week
 * @param {string} affinity
 * @param {number} currentWeek - 1-52 simulation week
 * @returns {number} Multiplier (1.0 to 1.8)
 */
export function calculateSeasonalMultiplier(affinity = "YEAR_ROUND", currentWeek = 1) {
  const weekInYear = ((currentWeek - 1) % 52) + 1;

  if (affinity === "SUMMER_BLOCKBUSTER") {
    // Weeks 20 to 32 (May - August)
    if (weekInYear >= 20 && weekInYear <= 32) return 1.5;
    return 0.85;
  } else if (affinity === "HOLIDAY_Q4") {
    // Weeks 45 to 52 (November - December)
    if (weekInYear >= 45 && weekInYear <= 52) return 1.8;
    return 0.75;
  } else if (affinity === "BACK_TO_SCHOOL") {
    // Weeks 33 to 38 (August - September)
    if (weekInYear >= 33 && weekInYear <= 38) return 1.4;
    return 0.9;
  }

  return 1.1; // Year-round baseline
}

/**
 * Calculates weekly customer demand for a merchandise product line
 */
export function calculateWeeklyMerchandiseDemand(product, ipStats = {}, currentWeek = 1) {
  const category = CATEGORY_CONFIGS[product.category] || CATEGORY_CONFIGS.ACTION_FIGURES_TOYS;
  const ipPopularity = ipStats.popularity || ipStats.quality || 60;
  const ipBonus = 1 + ipPopularity / 80;

  // Price elasticity: Higher markup lowers demand; heavy discounts increase demand
  const effectivePrice =
    product.retailPrice * (1 - (product.discountMarkdownPercent || 0) / 100);
  const markupRatio = effectivePrice / Math.max(1, product.unitManufacturingCost);
  const priceElasticityFactor = Math.max(0.35, Math.min(2.5, 3.5 / markupRatio));

  const seasonalMultiplier = calculateSeasonalMultiplier(product.seasonalAffinity, currentWeek);
  const qualityFactor = (product.qualityRating || 75) / 75;

  let demand =
    category.baseDemand *
    ipBonus *
    priceElasticityFactor *
    seasonalMultiplier *
    qualityFactor;

  // Discount boost
  if (product.discountMarkdownPercent > 0) {
    demand *= 1 + (product.discountMarkdownPercent / 100) * 1.5;
  }

  return Math.max(50, Math.round(demand));
}

/**
 * Simulates a single product line weekly sell-through turn
 */
export function simulateWeeklyProductSales(product, ipStats = {}, currentWeek = 1) {
  if (product.status === "SOLD_OUT" || product.status === "LIQUIDATED" || product.inventoryStock <= 0) {
    return {
      updatedProduct: { ...product, inventoryStock: 0, status: "SOLD_OUT" },
      unitsSold: 0,
      weeklyGrossRevenue: 0,
      weeklyStorageFee: 0,
      weeklyNetProfit: 0,
    };
  }

  const category = CATEGORY_CONFIGS[product.category] || CATEGORY_CONFIGS.ACTION_FIGURES_TOYS;
  const demand = calculateWeeklyMerchandiseDemand(product, ipStats, currentWeek);
  const unitsSold = Math.min(product.inventoryStock, demand);

  const effectivePrice =
    product.retailPrice * (1 - (product.discountMarkdownPercent || 0) / 100);
  const weeklyGrossRevenue = Math.round(unitsSold * effectivePrice);

  const remainingStock = Math.max(0, product.inventoryStock - unitsSold);
  const weeklyStorageFee = Math.round(remainingStock * category.storageCostPerUnit);
  const weeklyNetProfit = weeklyGrossRevenue - weeklyStorageFee;

  const updatedProduct = { ...product };
  updatedProduct.inventoryStock = remainingStock;
  updatedProduct.unitsSold = (updatedProduct.unitsSold || 0) + unitsSold;
  updatedProduct.weeklySalesRate = unitsSold;
  updatedProduct.totalGrossRevenue = (updatedProduct.totalGrossRevenue || 0) + weeklyGrossRevenue;
  updatedProduct.weeklyStorageFee = weeklyStorageFee;
  updatedProduct.totalNetProfit = (updatedProduct.totalNetProfit || 0) + weeklyNetProfit;

  if (remainingStock === 0) {
    updatedProduct.status = "SOLD_OUT";
  }

  return {
    updatedProduct,
    unitsSold,
    weeklyGrossRevenue,
    weeklyStorageFee,
    weeklyNetProfit,
  };
}

/**
 * Calculates liquidation recovery payout for unsold inventory
 */
export function calculateLiquidationValue(product) {
  const stock = product.inventoryStock || 0;
  if (stock <= 0) return { payout: 0, unitsLiquidated: 0 };

  // Recovers 35% of unit manufacturing cost
  const recoveryRate = product.unitManufacturingCost * 0.35;
  const payout = Math.round(stock * recoveryRate);

  return {
    payout,
    unitsLiquidated: stock,
  };
}

/**
 * Calculates restock manufacturing cost with bulk batch discounts
 */
export function calculateRestockBatchCost(unitCost, unitsCount) {
  let bulkDiscount = 0;
  if (unitsCount >= 50000) bulkDiscount = 0.20;
  else if (unitsCount >= 20000) bulkDiscount = 0.12;
  else if (unitsCount >= 5000) bulkDiscount = 0.05;

  const effectiveUnitCost = unitCost * (1 - bulkDiscount);
  return Math.round(unitsCount * effectiveUnitCost);
}
