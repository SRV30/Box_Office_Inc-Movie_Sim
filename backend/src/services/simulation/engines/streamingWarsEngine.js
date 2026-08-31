/**
 * @fileoverview OTT Streaming Wars & Content Bidding Engine (issue #546)
 *
 * Competitive bidding between AI platforms and player, exclusive rights management,
 * subscriber churn/growth, and weekly platform competition simulation.
 */

import StreamingRights from "../../../models/StreamingRights.js";
import {
  OTT_PLATFORMS,
  EXCLUSIVITY_WINDOWS,
  getOTTPlatform,
  getOTTPlatformList,
} from "../../../constants/streamingWars.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Transparent content valuation for bidding.
 * Formula: baseValue × qualityFactor × hypeFactor × windowMultiplier
 */
export const evaluateContentValue = (content, windowType = "POST_THEATRICAL_SVOD") => {
  const window = EXCLUSIVITY_WINDOWS[windowType] || EXCLUSIVITY_WINDOWS.POST_THEATRICAL_SVOD;
  const baseValue = content.worldwideGross || content.boxOffice || content.budget || 2000000;
  const qualityFactor = clamp((content.quality || content.criticScore || 50) / 50, 0.5, 2.0);
  const hypeFactor = 1 + ((content.hype || 50) / 100) * 1.5;

  return Math.round(baseValue * 0.35 * qualityFactor * hypeFactor * window.valueMultiplier);
};

/**
 * Checks whether content already has active exclusive rights.
 */
export const hasConflictingRights = async (contentId, contentType = "MOVIE") => {
  const existing = await StreamingRights.findOne({
    contentId,
    contentType,
    status: "ACTIVE",
  }).lean();
  return Boolean(existing);
};

/**
 * Generates strategic AI platform bids using transparent rules.
 */
export const generateStrategicBids = (content, windowType, askingPrice, gameState, rng = Math.random) => {
  const contentValue = evaluateContentValue(content, windowType);
  const platforms = gameState?.streamingPlatforms?.length
    ? gameState.streamingPlatforms.map((p) => {
        const def = getOTTPlatform(p.id) || {};
        return { ...def, ...p };
      })
    : getOTTPlatformList();

  const bids = [];

  for (const platform of platforms) {
    const aggression = platform.bidAggression || 1.0;
    const budgetFactor = clamp((platform.contentBudget || 500000000) / 1000000000, 0.3, 2.0);
    const prestigeFactor = 1 + ((platform.prestige || platform.popularity || 50) - 50) / 200;

    const maxBid = Math.round(contentValue * aggression * budgetFactor * prestigeFactor);
    const bidAmount = Math.round(maxBid * (0.85 + rng() * 0.3));
    const rawBid = Math.max(askingPrice, bidAmount);
    const finalBid = Math.min(rawBid, platform.contentBudget || rawBid);

    bids.push({
      platformId: platform.id,
      platform: platform.name,
      amount: finalBid,
      prestige: platform.prestige || platform.popularity || 50,
      isAI: !platform.isPlayerPlatform,
      createdAt: new Date(),
    });
  }

  return bids.sort((a, b) => b.amount - a.amount || b.prestige - a.prestige);
};

/**
 * Determines auction winner using transparent rules: highest bid, prestige tie-break.
 */
export const resolveAuctionWinner = (bids = []) => {
  if (!bids.length) return null;
  const sorted = [...bids].sort((a, b) => b.amount - a.amount || (b.prestige || 0) - (a.prestige || 0));
  return sorted[0];
};

/**
 * Awards exclusive streaming rights and updates platform/studio finances.
 */
export const awardStreamingRights = async ({
  content,
  contentType = "MOVIE",
  winner,
  windowType,
  studio,
  gameState,
  currentWeek,
}) => {
  const conflict = await hasConflictingRights(content._id, contentType);
  if (conflict) {
    throw new Error("Content already has active exclusive streaming rights.");
  }

  const window = EXCLUSIVITY_WINDOWS[windowType] || EXCLUSIVITY_WINDOWS.POST_THEATRICAL_SVOD;
  const platform = (gameState.streamingPlatforms || []).find((p) => p.id === winner.platformId || p.name === winner.platform);

  if (platform) {
    platform.contentBudget = Math.max(0, (platform.contentBudget || 0) - winner.amount);
    if (!platform.exclusiveMovies) platform.exclusiveMovies = [];
    if (contentType === "MOVIE" && !platform.exclusiveMovies.includes(content._id)) {
      platform.exclusiveMovies.push(content._id);
    }
    const qualityBoost = clamp(((content.quality || 50) - 50) / 50, -0.1, 0.3);
    platform.prestige = clamp((platform.prestige || platform.popularity || 50) + qualityBoost * 10, 0, 100);
    platform.popularity = platform.prestige;
  }

  if (studio) {
    studio.money = (studio.money || 0) + winner.amount;
  }

  const rights = await StreamingRights.create({
    contentId: content._id,
    contentType,
    contentTitle: content.title || "",
    platformId: winner.platformId || winner.platform,
    platformName: winner.platform,
    studioId: studio._id,
    bidAmount: winner.amount,
    windowType,
    exclusivityWeeks: window.weeks,
    startWeek: currentWeek,
    endWeek: currentWeek + window.weeks,
    status: "ACTIVE",
  });

  return rights;
};

/**
 * Calculates subscriber impact from catalog quality and exclusivity count.
 */
export const calculateSubscriberChange = (platform, avgCatalogQuality = 50) => {
  const exclusiveCount = platform.exclusiveMovies?.length || 0;
  const qualityFactor = (avgCatalogQuality - 50) / 100;
  const exclusivityBonus = Math.min(exclusiveCount * 0.001, 0.005);
  const churnRate = getOTTPlatform(platform.id)?.churnRate || 0.002;

  const growthRate = 0.001 + exclusivityBonus + qualityFactor * 0.002;
  const netRate = growthRate - churnRate;

  const subscriberDelta = Math.round((platform.subscribers || 0) * netRate);
  return {
    subscriberDelta,
    growthRate,
    churnRate,
    netRate,
  };
};

/**
 * Processes AI counteroffers on open auctions during weekly tick.
 */
export const processAICounteroffers = async (openAuctions, gameState, rng = Math.random) => {
  const counteroffers = [];

  for (const auction of openAuctions) {
    if (!auction.movieId || auction.counteroffers?.length >= 3) continue;

    const currentHigh = Math.max(
      auction.askingPrice,
      ...(auction.bids || []).map((b) => b.amount),
      ...(auction.counteroffers || []).map((c) => c.amount)
    );

    if (rng() > 0.25) continue;

    const aiPlatforms = getOTTPlatformList().filter((p) => !p.isPlayerPlatform);
    const bidder = aiPlatforms[Math.floor(rng() * aiPlatforms.length)];
    const counterAmount = Math.round(currentHigh * (1.05 + rng() * 0.1));

    counteroffers.push({
      auctionId: auction._id,
      platformId: bidder.id,
      platform: bidder.name,
      amount: counterAmount,
      isAI: true,
      week: gameState.currentWeek,
    });
  }

  return counteroffers;
};

/**
 * Weekly streaming wars simulation: subscriber competition, rights expiry, platform budgets.
 */
export const processWeeklyStreamingWars = async (gameState, studio) => {
  if (!gameState?.streamingPlatforms?.length) return { expiredRights: 0, subscriberChanges: [] };

  const currentWeek = gameState.currentWeek || 1;
  let expiredRights = 0;

  const expired = await StreamingRights.find({
    status: "ACTIVE",
    endWeek: { $lte: currentWeek },
  });

  for (const right of expired) {
    right.status = "EXPIRED";
    await right.save();
    expiredRights++;

    const platform = gameState.streamingPlatforms.find((p) => p.id === right.platformId);
    if (platform?.exclusiveMovies) {
      platform.exclusiveMovies = platform.exclusiveMovies.filter(
        (id) => String(id) !== String(right.contentId)
      );
    }
  }

  const subscriberChanges = [];

  for (const platform of gameState.streamingPlatforms) {
    const def = getOTTPlatform(platform.id) || {};
    platform.prestige = platform.prestige ?? platform.popularity ?? def.prestige ?? 50;

    const exclusiveCount = platform.exclusiveMovies?.length || 0;
    const avgQuality = exclusiveCount > 0 ? clamp(50 + exclusiveCount * 3, 40, 90) : 45;

    const { subscriberDelta } = calculateSubscriberChange(platform, avgQuality);
    platform.subscribers = Math.max(0, (platform.subscribers || 0) + subscriberDelta);
    platform.contentBudget = (platform.contentBudget || 0) + Math.round((def.contentBudget || 500000000) * 0.01);

    subscriberChanges.push({
      platformId: platform.id,
      name: platform.name,
      subscriberDelta,
      subscribers: platform.subscribers,
      prestige: platform.prestige,
    });
  }

  return { expiredRights, subscriberChanges };
};

export default {
  evaluateContentValue,
  hasConflictingRights,
  generateStrategicBids,
  resolveAuctionWinner,
  awardStreamingRights,
  calculateSubscriberChange,
  processWeeklyStreamingWars,
};
