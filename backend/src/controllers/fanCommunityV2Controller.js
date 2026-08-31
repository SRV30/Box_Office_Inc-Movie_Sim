import FanCommunityV2 from "../models/FanCommunityV2.js";
import { getOrCreateFanCommunity, triggerReviewBombing } from "../services/simulation/engines/fanCommunityV2Engine.js";

/**
 * Get all fan communities for active game state.
 */
export const getFanCommunities = async (req, res) => {
  try {
    const { gameStateId } = req.params;
    const communities = await FanCommunityV2.find({ gameStateId });
    return res.status(200).json({ success: true, communities });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Trigger review bombing campaign.
 */
export const handleTriggerReviewBombing = async (req, res) => {
  try {
    const { gameStateId, targetId, campaignType, triggerReason, currentWeek } = req.body;
    const community = await triggerReviewBombing(gameStateId, targetId, campaignType, triggerReason, currentWeek || 1);
    return res.status(200).json({ success: true, community });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
