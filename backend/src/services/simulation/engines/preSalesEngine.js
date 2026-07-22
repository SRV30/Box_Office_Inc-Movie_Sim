/**
 * Pre-Sales Engine — processes advance ticket campaigns during POST_PRODUCTION.
 * Each week a campaign is active, it converts hype + marketing into guaranteed
 * pre-sold ticket revenue based on the movie's current buzz.
 */
export const processPreSalesTick = (gameState, studio) => {
  if (!studio.preSalesCampaigns) {
    studio.preSalesCampaigns = [];
    return;
  }

  const activeCampaigns = studio.preSalesCampaigns.filter(c => c.active);
  for (const campaign of activeCampaigns) {
    if (campaign.budget <= 0) continue;

    // Base revenue per week = budget * multiplier (0.5 to 1.5 based on hype)
    const hypeFactor = 0.5 + Math.random();
    const weeklyRevenue = Math.floor(campaign.budget * hypeFactor);
    campaign.preSalesRevenue = (campaign.preSalesRevenue || 0) + weeklyRevenue;
  }
};
