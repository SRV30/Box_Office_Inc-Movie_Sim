/**
 * Territory Engine
 * Evaluates international film distribution deals across global markets.
 */

export function calculateTerritoryDealOffer(movie, region, dealType) {
  if (!movie) return { minimumGuarantee: 0, revenueSharePct: 0, localizationCost: 25000 };

  const regionalMultipliers = {
    EUROPE: 0.35,
    ASIA_PACIFIC: 0.40,
    LATIN_AMERICA: 0.15,
    MIDDLE_EAST_AFRICA: 0.10,
  };

  const mult = regionalMultipliers[region] || 0.2;
  const budget = movie.budget || 5000000;
  const rating = movie.qualityScore || 50;

  const baseValuation = budget * mult * (0.8 + rating / 100);
  const localizationCost = Math.round(20000 + mult * 20000);

  if (dealType === "MINIMUM_GUARANTEE") {
    return {
      minimumGuarantee: Math.round(baseValuation * 0.7),
      revenueSharePct: 15,
      localizationCost,
    };
  } else {
    return {
      minimumGuarantee: Math.round(baseValuation * 0.2),
      revenueSharePct: 55,
      localizationCost,
    };
  }
}
