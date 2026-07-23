/**
 * @fileoverview Merchandise Lines Engine (issue #349)
 *
 * Processes studio-level merchandise product lines with seasonal campaigns.
 * Merchandise lines are independent of individual movies and represent
 * branded product categories (apparel, collectibles, digital goods, etc.)
 * that generate recurring revenue based on studio prestige and fan count.
 *
 * Each week:
 *  1. Active lines generate revenue proportional to fans × prestige × quality.
 *  2. Active seasonal campaigns apply a boost multiplier.
 *  3. Campaigns expire after their duration.
 */

/**
 * The merchandise line tiers and their base weekly revenue rates.
 */
export const MERCH_LINE_TIERS = {
  APPAREL:      { label: "Apparel",      baseFanRate: 0.05, basePrestigeRate: 200 },
  COLLECTIBLES: { label: "Collectibles", baseFanRate: 0.08, basePrestigeRate: 400 },
  DIGITAL:      { label: "Digital Goods",baseFanRate: 0.03, basePrestigeRate: 100 },
  TOYS:         { label: "Toys & Games", baseFanRate: 0.06, basePrestigeRate: 300 },
};

/**
 * Processes all active merchandise lines and seasonal campaigns for the studio.
 * Mutates `studio` in place (adds money, expires campaigns).
 *
 * @param {object} gameState
 * @param {object} studio
 * @returns {number} Total weekly revenue from merch lines
 */
export const processMerchandiseLines = (gameState, studio) => {
  if (!studio.merchandiseLines || studio.merchandiseLines.length === 0) return 0;

  const currentWeek = gameState.currentWeek;
  let totalRevenue = 0;

  for (const line of studio.merchandiseLines) {
    if (!line.active) continue;

    const tier = MERCH_LINE_TIERS[line.tier] || MERCH_LINE_TIERS.APPAREL;

    // Base weekly revenue from fans + prestige
    const fanRevenue = Math.floor((studio.fans || 0) * tier.baseFanRate);
    const prestigeRevenue = Math.floor((studio.prestige || 0) * tier.basePrestigeRate);
    let lineRevenue = fanRevenue + prestigeRevenue;

    // Apply seasonal campaign boost
    let campaignBoost = 1.0;
    const activeCampaigns = (line.campaigns || []).filter(c => c.active);
    for (const campaign of activeCampaigns) {
      campaignBoost += campaign.boostMultiplier || 0;

      // Expire campaign if it's past its end week
      if (currentWeek >= campaign.endWeek) {
        campaign.active = false;
      }
    }

    lineRevenue = Math.floor(lineRevenue * campaignBoost);
    line.totalRevenue = (line.totalRevenue || 0) + lineRevenue;
    totalRevenue += lineRevenue;
  }

  if (totalRevenue > 0) {
    studio.money = (studio.money || 0) + totalRevenue;

    studio.merchandiseIncomeHistory = studio.merchandiseIncomeHistory || [];
    studio.merchandiseIncomeHistory.push({
      week: currentWeek,
      amount: totalRevenue,
      reason: "Merchandise Line Sales"
    });
  }

  return totalRevenue;
};
