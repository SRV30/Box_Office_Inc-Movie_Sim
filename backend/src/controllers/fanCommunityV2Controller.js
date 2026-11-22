import FanCommunityV2 from "../models/FanCommunityV2.js";
import GameState from "../models/GameState.js";
import { triggerReviewBombing } from "../services/simulation/engines/fanCommunityV2Engine.js";

/**
 * Get all fan communities for authenticated player's game state.
 */
export const getFanCommunities = async (req, res) => {
  try {
    const gameState = await GameState.findOne({ user: req.user._id });
    if (!gameState) {
      return res.status(404).json({ success: false, message: "Game state not found" });
    }

    // Verify ownership if caller explicitly passed a gameStateId parameter
    if (req.params.gameStateId && req.params.gameStateId !== gameState._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized game state access" });
    }

    const communities = await FanCommunityV2.find({ gameStateId: gameState._id });
    return res.status(200).json({ success: true, communities });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Trigger review bombing campaign for authenticated player's game state.
 */
export const handleTriggerReviewBombing = async (req, res) => {
  try {
    const gameState = await GameState.findOne({ user: req.user._id });
    if (!gameState) {
      return res.status(404).json({ success: false, message: "Game state not found" });
    }

    const { gameStateId, targetId, campaignType, triggerReason, currentWeek } = req.body;

    if (gameStateId && gameStateId !== gameState._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized game state access" });
    }

    if (!targetId || !campaignType) {
      return res.status(400).json({ success: false, message: "targetId and campaignType are required" });
    }

    const community = await triggerReviewBombing(
      gameState._id,
      targetId,
      campaignType,
      triggerReason,
      currentWeek || gameState.currentWeek || 1
    );
    return res.status(200).json({ success: true, community });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
