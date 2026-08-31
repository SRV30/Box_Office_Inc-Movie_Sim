import AIStudioStrategyV2 from "../models/AIStudioStrategyV2.js";
import { V2_STRATEGY_PROFILES, getOrInitAIStrategyV2 } from "../services/simulation/engines/aiEngineV2.js";

/**
 * Get all V2 AI studio strategies for active game state.
 */
export const getAIStrategiesV2 = async (req, res) => {
  try {
    const { gameStateId } = req.params;
    const strategies = await AIStudioStrategyV2.find({ gameStateId });
    return res.status(200).json({ success: true, strategies, profiles: V2_STRATEGY_PROFILES });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update rival studio strategy type.
 */
export const updateAIStrategyV2 = async (req, res) => {
  try {
    const { gameStateId, rivalStudioId, strategyType } = req.body;
    const strategyDoc = await AIStudioStrategyV2.findOneAndUpdate(
      { gameStateId, rivalStudioId },
      { strategyType },
      { new: true, upsert: true }
    );
    return res.status(200).json({ success: true, strategy: strategyDoc });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
