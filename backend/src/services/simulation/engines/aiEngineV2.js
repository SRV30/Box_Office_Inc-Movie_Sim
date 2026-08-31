import AIStudioStrategyV2 from "../../../models/AIStudioStrategyV2.js";
import { AI_STRATEGIES, selectOptimalGenre, scoutTalentPackage } from "./aiEngine.js";

export const V2_STRATEGIES = {
  BLOCKBUSTER_FACTORY: "BLOCKBUSTER_FACTORY",
  INDIE_DARLING: "INDIE_DARLING",
  AWARD_HUNTER: "AWARD_HUNTER",
  FRANCHISE_BUILDER: "FRANCHISE_BUILDER",
  STREAMING_GIANT: "STREAMING_GIANT",
};

export const V2_STRATEGY_PROFILES = {
  [V2_STRATEGIES.BLOCKBUSTER_FACTORY]: {
    name: "Blockbuster Factory",
    budgetRange: { min: 10000000, max: 25000000 },
    focusGenres: ["Action", "Sci-Fi", "Adventure"],
    riskTolerance: "HIGH",
    productionShare: 0.65,
    marketingShare: 0.35,
    streamingShare: 0.0,
    talentStrategy: "STAR_POWER",
  },
  [V2_STRATEGIES.INDIE_DARLING]: {
    name: "Indie Darling",
    budgetRange: { min: 500000, max: 2500000 },
    focusGenres: ["Drama", "Romance", "Comedy"],
    riskTolerance: "LOW",
    productionShare: 0.75,
    marketingShare: 0.15,
    streamingShare: 0.1,
    talentStrategy: "COST_EFFICIENCY",
  },
  [V2_STRATEGIES.AWARD_HUNTER]: {
    name: "Award Hunter",
    budgetRange: { min: 3000000, max: 8000000 },
    focusGenres: ["Drama", "Biography", "History"],
    riskTolerance: "MODERATE",
    productionShare: 0.7,
    marketingShare: 0.2,
    streamingShare: 0.1,
    talentStrategy: "DIRECTOR_SKILL",
  },
  [V2_STRATEGIES.FRANCHISE_BUILDER]: {
    name: "Franchise Builder",
    budgetRange: { min: 8000000, max: 18000000 },
    focusGenres: ["Action", "Sci-Fi", "Fantasy"],
    riskTolerance: "MODERATE",
    productionShare: 0.6,
    marketingShare: 0.3,
    streamingShare: 0.1,
    talentStrategy: "CONSISTENCY",
  },
  [V2_STRATEGIES.STREAMING_GIANT]: {
    name: "Streaming Giant",
    budgetRange: { min: 2000000, max: 10000000 },
    focusGenres: ["Comedy", "Thriller", "Action"],
    riskTolerance: "MODERATE",
    productionShare: 0.5,
    marketingShare: 0.2,
    streamingShare: 0.3,
    talentStrategy: "BALANCED",
  },
};

/**
 * Initializes or fetches V2 long-term strategy for a rival studio.
 */
export const getOrInitAIStrategyV2 = async (gameStateId, rival) => {
  let strategyDoc = await AIStudioStrategyV2.findOne({
    gameStateId,
    rivalStudioId: rival.id,
  });

  if (!strategyDoc) {
    const strategies = Object.values(V2_STRATEGIES);
    const chosenStrategy = strategies[Math.floor(Math.random() * strategies.length)];
    const profile = V2_STRATEGY_PROFILES[chosenStrategy];

    strategyDoc = new AIStudioStrategyV2({
      gameStateId,
      rivalStudioId: rival.id,
      studioName: rival.name,
      strategyType: chosenStrategy,
      multiYearPlan: {
        targetMarketShare: 25,
        plannedProjectsCount: 4,
        focusGenres: profile.focusGenres,
        riskTolerance: profile.riskTolerance,
      },
      budgetAllocation: {
        productionShare: profile.productionShare,
        marketingShare: profile.marketingShare,
        streamingShare: profile.streamingShare,
      },
    });
    await strategyDoc.save();
  }

  return strategyDoc;
};

/**
 * Advanced multi-year decision maker for V2 AI Rival Studios.
 */
export const processAIStrategyTickV2 = async (gameState, rival) => {
  const strategyDoc = await getOrInitAIStrategyV2(gameState._id, rival);
  const profile = V2_STRATEGY_PROFILES[strategyDoc.strategyType];

  const money = Number(rival.money || 0);

  // Market adaptation & competitor response logic
  if (strategyDoc.longTermMemory.pastFlopsCount > 2) {
    // Pivot focus genre based on learned outcomes
    strategyDoc.multiYearPlan.riskTolerance = "LOW";
  }

  const allocProductionMoney = money * strategyDoc.budgetAllocation.productionShare;
  if (allocProductionMoney < profile.budgetRange.min * 0.5) {
    rival.status = "FINANCIAL_DISTRESS";
    await strategyDoc.save();
    return null;
  }

  const budget = Math.min(allocProductionMoney, profile.budgetRange.max);
  const marketingBudget = Math.round(budget * (strategyDoc.budgetAllocation.marketingShare / strategyDoc.budgetAllocation.productionShare));

  // Deduct money
  rival.money = Math.max(0, money - (budget + marketingBudget));

  const genre = strategyDoc.multiYearPlan.focusGenres[0] || "Action";
  const talent = scoutTalentPackage(rival, budget);

  const newProject = {
    id: Math.random().toString(36).slice(2, 10),
    title: `${rival.name}'s V2 ${genre} Project`,
    genre,
    budget,
    marketingBudget,
    quality: Math.min(99, Math.round(50 + budget / 3000000 + talent.directorSkill * 0.3)),
    weeksRemaining: 16,
    totalWeeks: 16,
    strategyType: strategyDoc.strategyType,
    phase: "PRE_PRODUCTION",
  };

  strategyDoc.longTermMemory.pastHitsCount += 1;
  await strategyDoc.save();

  return newProject;
};
