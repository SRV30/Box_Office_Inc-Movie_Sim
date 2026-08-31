import AwardCeremonyV2 from "../models/AwardCeremonyV2.js";
import { CEREMONY_CONFIGS, processCeremony } from "../services/simulation/engines/awardCeremonyV2Engine.js";
import GameState from "../models/GameState.js";

/**
 * Get historical ceremony records for active game state.
 */
export const getCeremonyHistory = async (req, res) => {
  try {
    const { gameStateId } = req.params;
    const ceremonies = await AwardCeremonyV2.find({ gameStateId }).sort({ year: -1 });
    return res.status(200).json({ success: true, ceremonies });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get available ceremony configurations and categories.
 */
export const getCeremonyConfigs = async (req, res) => {
  try {
    return res.status(200).json({ success: true, configs: CEREMONY_CONFIGS });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Manually trigger ceremony evaluation (for testing or dev tools).
 */
export const triggerCeremonyEvaluation = async (req, res) => {
  try {
    const { gameStateId, ceremonyKey } = req.body;
    const gameState = await GameState.findById(gameStateId);
    if (!gameState) {
      return res.status(404).json({ success: false, error: "GameState not found" });
    }

    const ceremony = await processCeremony(gameState, ceremonyKey || "GLOBAL_ACADEMY");
    return res.status(200).json({ success: true, ceremony });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
