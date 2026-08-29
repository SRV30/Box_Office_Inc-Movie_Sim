/**
 * @fileoverview Streaming Platform Economy & Subscriber Simulation Engine
 * Simulates autonomous AI and player streaming platforms, subscriber acquisition & churn,
 * catalog watch-hour engagement, server infrastructure costs, recommendation algorithms, and P&L.
 */

export const STRATEGY_CONFIGS = {
  PRESTIGE_FIRST: {
    targetQualityMin: 75,
    churnReductionBonus: 0.8,
    acquisitionHypeBonus: 1.15,
    pricingTolerance: 1.3,
  },
  BLOCKBUSTER_FOCUSED: {
    targetQualityMin: 60,
    churnReductionBonus: 0.9,
    acquisitionHypeBonus: 1.35,
    pricingTolerance: 1.2,
  },
  BUDGET_MASS_MARKET: {
    targetQualityMin: 40,
    churnReductionBonus: 1.0,
    acquisitionHypeBonus: 1.5,
    pricingTolerance: 0.7, // Must stay cheap
  },
  NICHE_INDIE: {
    targetQualityMin: 70,
    churnReductionBonus: 0.75,
    acquisitionHypeBonus: 0.9,
    pricingTolerance: 1.1,
  },
  BALANCED: {
    targetQualityMin: 55,
    churnReductionBonus: 1.0,
    acquisitionHypeBonus: 1.1,
    pricingTolerance: 1.0,
  },
};

/**
 * Calculates new subscriber acquisition for a week
 */
export function calculateSubscriberAcquisition(platform) {
  const catalog = platform.catalog || [];
  const catalogCount = Math.max(1, catalog.length);
  const avgQuality =
    catalog.reduce((sum, item) => sum + (item.qualityScore || 50), 0) / catalogCount;
  const exclusiveCount = catalog.filter((item) => item.isExclusive).length;

  const price = platform.monthlySubscriptionPrice || 9.99;
  const priceValueRatio = Math.max(0.4, Math.min(2.5, (avgQuality * 0.2 + catalogCount * 0.5) / (price * 2)));

  const strategy = STRATEGY_CONFIGS[platform.strategy] || STRATEGY_CONFIGS.BALANCED;
  const prestigeMultiplier = 1 + (platform.prestigeRating || 50) / 150;

  // Base acquisition pool
  let baseGrowth = 15000 + catalogCount * 1200 + exclusiveCount * 4500;
  baseGrowth *= priceValueRatio * strategy.acquisitionHypeBonus * prestigeMultiplier;

  // Market saturation dampener for massive subscriber counts
  const currentSubs = platform.subscribers || 0;
  if (currentSubs > 10000000) {
    baseGrowth *= 0.65;
  } else if (currentSubs > 5000000) {
    baseGrowth *= 0.82;
  }

  return Math.max(500, Math.round(baseGrowth));
}

/**
 * Calculates weekly churn (subscribers canceling their subscription)
 */
export function calculateSubscriberChurn(platform) {
  const currentSubs = platform.subscribers || 1000000;
  const price = platform.monthlySubscriptionPrice || 9.99;
  const techLevel = platform.recommendationTechLevel || 1;
  const strategy = STRATEGY_CONFIGS[platform.strategy] || STRATEGY_CONFIGS.BALANCED;

  // Base churn rate between 1.5% and 6.0% weekly
  let churnRate = 0.035;

  // Price impact
  if (price > 18) churnRate += 0.02;
  else if (price > 13) churnRate += 0.01;
  else if (price < 6.99) churnRate -= 0.01;

  // Recommendation engine discount (-0.2% per tech tier)
  churnRate -= techLevel * 0.002;

  // Catalog engagement retention bonus
  const catalogCount = (platform.catalog || []).length;
  if (catalogCount > 20) churnRate -= 0.005;

  // Strategy modifier
  churnRate *= strategy.churnReductionBonus;

  // Clamp churn rate
  churnRate = Math.max(0.008, Math.min(0.12, churnRate));
  const lostSubs = Math.round(currentSubs * churnRate);

  return {
    churnRatePercent: Number((churnRate * 100).toFixed(2)),
    subscribersLost: lostSubs,
  };
}

/**
 * Calculates weekly platform economics and P&L
 */
export function calculatePlatformFinancials(platform) {
  const subs = platform.subscribers || 0;
  const price = platform.monthlySubscriptionPrice || 9.99;

  // Weekly gross (Monthly price divided by 4.33 weeks/month)
  const weeklyGrossRevenue = Math.round((subs * price) / 4.33);

  // Server & CDN cost ($0.03 per subscriber adjusted for bandwidth tier)
  const bandwidthTier = platform.serverBandwidthTier || 1;
  const weeklyServerCost = Math.round(subs * (0.025 + bandwidthTier * 0.005));

  // Content Licensing expenses
  const weeklyContentCost = (platform.catalog || []).reduce(
    (sum, item) => sum + (item.weeklyLicensingCost || 10000),
    0
  );

  const weeklyNetProfit = weeklyGrossRevenue - weeklyServerCost - weeklyContentCost;

  return {
    weeklyGrossRevenue,
    weeklyServerCost,
    weeklyContentCost,
    weeklyNetProfit,
  };
}

/**
 * Calculates cost to upgrade recommendation algorithm level
 */
export function calculateRecommendationUpgradeCost(currentTier = 1) {
  if (currentTier >= 10) return 0;
  return Math.round(150000 * Math.pow(currentTier, 1.4));
}

/**
 * Simulates a single weekly turn for a platform
 */
export function simulatePlatformWeeklyTick(platform, currentWeek = 1) {
  const acquired = calculateSubscriberAcquisition(platform);
  const churn = calculateSubscriberChurn(platform);
  const updatedSubs = Math.max(0, (platform.subscribers || 0) + acquired - churn.subscribersLost);

  const updatedPlatform = { ...platform };
  updatedPlatform.subscribers = updatedSubs;
  updatedPlatform.weeklySubscriberGrowth = acquired;
  updatedPlatform.weeklySubscriberChurn = churn.subscribersLost;
  updatedPlatform.churnRatePercent = churn.churnRatePercent;

  const financials = calculatePlatformFinancials(updatedPlatform);
  updatedPlatform.weeklyGrossRevenue = financials.weeklyGrossRevenue;
  updatedPlatform.weeklyServerCost = financials.weeklyServerCost;
  updatedPlatform.weeklyContentCost = financials.weeklyContentCost;
  updatedPlatform.weeklyNetProfit = financials.weeklyNetProfit;
  updatedPlatform.totalCumulativeProfit =
    (updatedPlatform.totalCumulativeProfit || 0) + financials.weeklyNetProfit;

  // Record historical trend
  updatedPlatform.historicalSubscribers = updatedPlatform.historicalSubscribers || [];
  updatedPlatform.historicalSubscribers.push({
    week: currentWeek,
    subscribers: updatedSubs,
    netProfit: financials.weeklyNetProfit,
  });

  return updatedPlatform;
}
