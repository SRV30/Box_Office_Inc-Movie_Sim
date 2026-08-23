import GameState from "../models/GameState.js";
import Notification from "../models/Notification.js";
import Studio from "../models/Studio.js";
import { withTransaction } from "../utils/financeTransactionHelper.js";

const findGameState = async (userId) => GameState.findOne({ user: userId });

/**
 * Initiate a contract negotiation with a talent.
 * POST /api/contracts/negotiate
 *
 * Body: { talentId, talentType, offer: { baseSalary, backendPoints, movieCount } }
 */
export const negotiateContract = async (req, res) => {
  try {
    const { talentId, talentType, offer } = req.body;

    if (!talentId || !talentType || !offer) {
      return res.status(400).json({
        success: false,
        message: "talentId, talentType, and offer are required.",
      });
    }

    if (!["ACTOR", "DIRECTOR", "WRITER"].includes(talentType)) {
      return res.status(400).json({
        success: false,
        message: "talentType must be ACTOR, DIRECTOR, or WRITER.",
      });
    }

    const gameState = await findGameState(req.user._id);
    if (!gameState) {
      return res.status(404).json({
        success: false,
        message: "Game state not found.",
      });
    }

    // Check if there is already a pending contract for this talent
    const existing = (gameState.pendingContracts || []).find(
      (c) => c.talentId === talentId && c.status === "PENDING"
    );

    if (existing) {
      // This is a counter-offer round
      existing.round += 1;
      existing.offer = {
        baseSalary: Number(offer.baseSalary || 0),
        backendPoints: Math.min(20, Number(offer.backendPoints || 0)),
        movieCount: Math.max(1, Math.min(3, Number(offer.movieCount || 1))),
      };

      // Check acceptance: higher offer = more likely to accept
      // Talent has a hidden threshold based on their popularity/reputation
      const acceptChance = calculateAcceptChance(existing.offer, existing.round);

      if (Math.random() < acceptChance) {
        existing.status = "ACCEPTED";
        await gameState.save();

        await Notification.create({
          gameStateId: gameState._id,
          message: `${existing.talentName || "Talent"} accepted your contract offer! Base: ₹${existing.offer.baseSalary.toLocaleString()}, Backend: ${existing.offer.backendPoints}%, Movies: ${existing.offer.movieCount}.`,
        });

        return res.status(200).json({
          success: true,
          message: "Contract accepted!",
          data: { contract: existing, accepted: true },
        });
      }

      // Rejected — reduce patience
      existing.patience -= 1;
      if (existing.patience <= 0) {
        existing.status = "EXPIRED";
        await gameState.save();

        await Notification.create({
          gameStateId: gameState._id,
          message: `${existing.talentName || "Talent"} lost patience and walked away from negotiations.`,
        });

        return res.status(200).json({
          success: true,
          message: "Talent walked away. Negotiations failed.",
          data: { contract: existing, accepted: false, expired: true },
        });
      }

      await gameState.save();

      return res.status(200).json({
        success: true,
        message: `Counter-offer rejected. ${existing.patience} round(s) remaining.`,
        data: { contract: existing, accepted: false, expired: false },
      });
    }

    // New negotiation
    const talentName = resolveTalentName(gameState, talentId, talentType);
    const contract = {
      talentId,
      talentType,
      talentName,
      offer: {
        baseSalary: Number(offer.baseSalary || 0),
        backendPoints: Math.min(20, Number(offer.backendPoints || 0)),
        movieCount: Math.max(1, Math.min(3, Number(offer.movieCount || 1))),
      },
      patience: 3,
      round: 1,
      status: "PENDING",
    };

    if (!gameState.pendingContracts) gameState.pendingContracts = [];
    gameState.pendingContracts.push(contract);
    await gameState.save();

    // Check initial acceptance
    const acceptChance = calculateAcceptChance(contract.offer, contract.round);
    const created = gameState.pendingContracts[gameState.pendingContracts.length - 1];

    if (Math.random() < acceptChance) {
      created.status = "ACCEPTED";
      await gameState.save();

      await Notification.create({
        gameStateId: gameState._id,
        message: `${talentName || "Talent"} accepted your initial offer!`,
      });

      return res.status(201).json({
        success: true,
        message: "Contract accepted on first offer!",
        data: { contract: created, accepted: true },
      });
    }

    created.patience -= 1;
    await gameState.save();

    res.status(201).json({
      success: true,
      message: `${talentName || "Talent"} rejected your initial offer. ${created.patience} round(s) remaining.`,
      data: { contract: created, accepted: false },
    });
  } catch (error) {
    console.error("Error negotiating contract:", error);
    res.status(500).json({
      success: false,
      message: "Failed to negotiate contract.",
    });
  }
};

/**
 * Accept a pending contract (finalize the deal at current terms).
 * POST /api/contracts/accept
 * Body: { talentId }
 */
export const acceptContract = async (req, res) => {
  try {
    const { talentId } = req.body;
    if (!talentId) {
      return res.status(400).json({
        success: false,
        message: "talentId is required.",
      });
    }

    const gameState = await findGameState(req.user._id);
    if (!gameState) {
      return res.status(404).json({
        success: false,
        message: "Game state not found.",
      });
    }

    const contract = (gameState.pendingContracts || []).find(
      (c) => c.talentId === talentId && c.status === "ACCEPTED"
    );

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "No accepted contract found for this talent.",
      });
    }

    // Apply the contract terms to the talent
    const talent = findTalentInGameState(gameState, talentId, contract.talentType);
    if (talent) {
      talent.salary = contract.offer.baseSalary;
      talent.contractMovies = contract.offer.movieCount;
      talent.backendPoints = contract.offer.backendPoints;
    }

    // Remove from pending
    contract.status = "ACCEPTED";
    await gameState.save();

    await Notification.create({
      gameStateId: gameState._id,
      message: `Contract finalized with ${contract.talentName || "talent"}. Salary: ₹${contract.offer.baseSalary.toLocaleString()}/week.`,
    });

    res.status(200).json({
      success: true,
      message: "Contract finalized.",
      data: { contract },
    });
  } catch (error) {
    console.error("Error accepting contract:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept contract.",
    });
  }
};

/**
 * Get all pending contracts.
 * GET /api/contracts
 */
export const getPendingContracts = async (req, res) => {
  try {
    const gameState = await findGameState(req.user._id);
    if (!gameState) {
      return res.status(404).json({
        success: false,
        message: "Game state not found.",
      });
    }

    const pending = (gameState.pendingContracts || []).filter(
      (c) => c.status === "PENDING" || c.status === "ACCEPTED"
    );

    res.status(200).json({
      success: true,
      data: pending,
    });
  } catch (error) {
    console.error("Error getting contracts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get contracts.",
    });
  }
};

export const buyoutContract = async (req, res) => {
  try {
    const { contractId } = req.body;
    let penalty;
    let updatedMoney;

    await withTransaction(async (session) => {
      const gameState = await GameState.findOne({ user: req.user._id }).session(session);
      if (!gameState) {
        const error = new Error("Game state not found");
        error.statusCode = 404;
        throw error;
      }

      const contractIndex = (gameState.pendingContracts || []).findIndex(
        (c) => c._id.toString() === contractId || c.contractId === contractId
      );
      if (contractIndex === -1) {
        const error = new Error("Contract not found");
        error.statusCode = 404;
        throw error;
      }

      const contract = gameState.pendingContracts[contractIndex];
      penalty = Math.round((contract.offer?.baseSalary || 100000) * 1.5);

      const updatedStudio = await Studio.findOneAndUpdate(
        { owner: req.user._id, money: { $gte: penalty } },
        { $inc: { money: -penalty } },
        { returnDocument: "after", session }
      );

      if (!updatedStudio) {
        const checkStudio = await Studio.findOne({ owner: req.user._id }).session(session);
        if (!checkStudio) {
          const error = new Error("Studio not found");
          error.statusCode = 404;
          throw error;
        }
        const error = new Error("Insufficient funds for buyout penalty");
        error.statusCode = 400;
        throw error;
      }

      updatedMoney = updatedStudio.money;

      gameState.pendingContracts[contractIndex].status = "TERMINATED";
      await gameState.save({ session });
    });

    return res.status(200).json({
      success: true,
      message: "Contract terminated successfully",
      data: { penaltyPaid: penalty, money: updatedMoney },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error("Error buying out contract:", error);
    res.status(500).json({ success: false, message: "Failed to buyout contract" });
  }
};

/**
 * Renegotiate active contract parameters.
 * POST /api/contracts/renegotiate
 */
export const renegotiateContract = async (req, res) => {
  try {
    const { contractId, newOffer } = req.body;
    const gameState = await findGameState(req.user._id);

    if (!gameState) {
      return res.status(404).json({ success: false, message: "Game state not found" });
    }

    const contract = (gameState.pendingContracts || []).find(
      (c) => c._id.toString() === contractId || c.contractId === contractId
    );

    if (!contract) {
      return res.status(404).json({ success: false, message: "Contract not found" });
    }

    if (contract.status !== "ACCEPTED") {
      return res.status(400).json({ success: false, message: "Only active accepted contracts can be renegotiated" });
    }

    const updatedBaseSalary = Number(newOffer.baseSalary || contract.offer.baseSalary);
    const updatedBackendPoints = Math.min(25, Number(newOffer.backendPoints || contract.offer.backendPoints));

    contract.offer.baseSalary = updatedBaseSalary;
    contract.offer.backendPoints = updatedBackendPoints;
    contract.status = "RENEGOTIATED";
    contract.renegotiatedCount = (contract.renegotiatedCount || 0) + 1;

    await gameState.save();

    return res.status(200).json({
      success: true,
      message: "Contract successfully renegotiated",
      data: contract,
    });
  } catch (error) {
    console.error("Error renegotiating contract:", error);
    res.status(500).json({ success: false, message: "Failed to renegotiate contract" });
  }
};


// --- Helpers ---

function calculateAcceptChance(offer, round) {
  // Higher salary and backend points increase acceptance chance
  // Acceptance increases with each round (talent gets more flexible)
  const salaryFactor = Math.min(1, Number(offer.baseSalary || 0) / 500000);
  const backendFactor = Math.min(1, Number(offer.backendPoints || 0) / 10);
  const roundBonus = round * 0.1;
  return Math.min(0.9, 0.2 + salaryFactor * 0.3 + backendFactor * 0.2 + roundBonus);
}

function resolveTalentName(gameState, talentId, talentType) {
  const lists = {
    ACTOR: gameState.ownedActors,
    DIRECTOR: gameState.ownedDirectors,
    WRITER: gameState.ownedWriters,
  };
  const list = lists[talentType] || [];
  const talent = list.find((t) => t.id === talentId);
  return talent?.name || "Unknown";
}

function findTalentInGameState(gameState, talentId, talentType) {
  const lists = {
    ACTOR: gameState.ownedActors,
    DIRECTOR: gameState.ownedDirectors,
    WRITER: gameState.ownedWriters,
  };
  const list = lists[talentType] || [];
  return list.find((t) => t.id === talentId) || null;
}
