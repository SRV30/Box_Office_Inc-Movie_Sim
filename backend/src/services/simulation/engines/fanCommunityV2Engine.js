import FanCommunityV2 from "../../../models/FanCommunityV2.js";
import Notification from "../../../models/Notification.js";

const THEORY_TEMPLATES = [
  "The secret main villain was hidden in plain sight in scene 3!",
  "Multiverse crossover confirmed by subtle background easter eggs!",
  "Lead character is actually a clone from an unreleased prequel script!",
  "Time travel paradox explains the ending cliffhanger!",
];

/**
 * Calculates fan sentiment impact on box office and review score multipliers.
 */
export const calculateFanImpactMultiplier = (community) => {
  if (!community) return 1.0;
  
  let multiplier = 1.0;
  const sentimentEffect = (community.sentimentScore - 50) / 100; // -0.5 to +0.5
  multiplier += sentimentEffect * 0.2; // 0.9x to 1.1x

  if (community.reviewBombingState?.isReviewBombing) {
    if (community.reviewBombingState.campaignType === "HATE_CAMPAIGN") {
      multiplier *= 0.65; // 35% drop due to negative review bombing
    } else if (community.reviewBombingState.campaignType === "PRAISE_CAMPAIGN") {
      multiplier *= 1.25; // 25% boost due to fan rally
    }
  }

  return Math.max(0.3, Math.min(1.5, multiplier));
};

/**
 * Creates or gets a persistent fan community for a movie/actor/franchise.
 */
export const getOrCreateFanCommunity = async (gameStateId, targetType, targetId, targetName) => {
  let community = await FanCommunityV2.findOne({
    gameStateId,
    targetType,
    targetId,
  });

  if (!community) {
    community = new FanCommunityV2({
      gameStateId,
      targetType,
      targetId,
      targetName,
      fanClubName: `${targetName} Official Fan Club`,
      memberCount: 5000 + Math.floor(Math.random() * 20000),
      loyaltyScore: 60,
      sentimentScore: 80,
      activeFanTheories: [
        {
          id: Math.random().toString(36).slice(2, 10),
          title: "Fan Theory #1",
          description: THEORY_TEMPLATES[Math.floor(Math.random() * THEORY_TEMPLATES.length)],
          virality: 75,
          createdWeek: 1,
        },
      ],
    });
    await community.save();
  }

  return community;
};

/**
 * Triggers review-bombing campaign on a target fan community.
 */
export const triggerReviewBombing = async (gameStateId, targetId, campaignType, triggerReason, currentWeek) => {
  const community = await FanCommunityV2.findOne({ gameStateId, targetId });
  if (!community) return null;

  community.reviewBombingState = {
    isReviewBombing: true,
    campaignType,
    triggerReason,
    intensityMultiplier: campaignType === "HATE_CAMPAIGN" ? 2.5 : 1.8,
    startWeek: currentWeek,
  };

  community.sentimentScore = campaignType === "HATE_CAMPAIGN" ? 20 : 95;
  await community.save();

  await Notification.create({
    gameStateId,
    type: "CRISIS",
    message: `🚨 ${community.fanClubName} started a ${campaignType}! Reason: ${triggerReason}`,
    createdAt: new Date(),
  });

  return community;
};

/**
 * Weekly simulation tick for fan community growth, decay, theory virality & review bombing recovery.
 */
export const processFanCommunityTick = async (gameState) => {
  const communities = await FanCommunityV2.find({ gameStateId: gameState._id });

  for (const comm of communities) {
    // Member growth/decay based on sentiment
    if (comm.sentimentScore > 60) {
      comm.memberCount = Math.round(comm.memberCount * 1.02);
    } else if (comm.sentimentScore < 40) {
      comm.memberCount = Math.max(100, Math.round(comm.memberCount * 0.97));
    }

    // Review bombing recovery over 4 weeks
    if (comm.reviewBombingState?.isReviewBombing) {
      const weeksElapsed = gameState.currentWeek - (comm.reviewBombingState.startWeek || gameState.currentWeek);
      if (weeksElapsed >= 4) {
        comm.reviewBombingState.isReviewBombing = false;
        comm.reviewBombingState.campaignType = "NONE";
        comm.sentimentScore = 65; // Recover to baseline
      }
    }

    await comm.save();
  }
};
