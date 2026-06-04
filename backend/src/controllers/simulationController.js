import GameState from "../models/GameState.js";
import Studio from "../models/Studio.js";
import { runWeeklySimulation } from "../services/simulation/runWeeklySimulation.js";

export const simulateWeek = async (req, res) => {
  try {
    const gameState = await GameState.findOne({
      user: req.user._id,
    });

    if (!gameState) {
      return res.status(404).json({
        message: "Game state not found",
      });
    }

    const studio = await Studio.findOne({
      owner: req.user._id,
    });

    if (!studio) {
      return res.status(404).json({
        message: "Studio not found",
      });
    }

    await runWeeklySimulation(gameState, studio);

    await gameState.save();
    await studio.save();

    res.status(200).json({
      message: "Week simulated successfully",

      currentWeek: gameState.currentWeek,

      money: studio.money,

      ownedWriters: gameState.ownedWriters,

      notifications: gameState.notifications,
    });
  } catch (error) {
    console.error("SIMULATION ERROR:", error);

    res.status(500).json({
      message: "Simulation failed",
    });
  }
};
