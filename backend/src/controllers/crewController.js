import GameState from "../models/GameState.js";
import Studio from "../models/Studio.js";
import { generateCrewTeams } from "../services/crew/crewGenerator.js";
import { getMarketplaceTalent, invalidateUserCache } from "../utils/marketplaceHelper.js";
import Notification from "../models/Notification.js";
import { calculateSigningFee } from "../services/talent/signingFeeService.js";
import MarketCrewTeam from "../models/MarketCrewTeam.js";
import CrewTeamEngine from "../services/crew/crewTeamEngine.js";

const findGameState = async (userId) => GameState.findOne({ user: userId });

export const getMarketCrewTeams = async (req, res) => {
  try {
    const count = await MarketCrewTeam.countDocuments({ userId: req.user._id });

    if (count === 0) {
      const teams = generateCrewTeams(50);
      const enriched = teams.map((t) => ({ ...t, userId: req.user._id }));
      await MarketCrewTeam.insertMany(enriched);
    }

    const marketDocs = await MarketCrewTeam.find({ userId: req.user._id }).lean();
    const result = getMarketplaceTalent(marketDocs, req.query);
    res.status(200).json({
      success: true,
      crewTeams: result.items,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOwnedCrewTeams = async (req, res) => {
  try {
    const gameState = await findGameState(req.user._id);
    if (!gameState) return res.status(404).json({ success: false, message: "Game state not found" });

    res.status(200).json({ success: true, crewTeams: gameState.ownedCrewTeams || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const hireCrewTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const gameState = await findGameState(req.user._id);
    if (!gameState) return res.status(404).json({ success: false, message: "Game state not found" });

    const marketDoc = await MarketCrewTeam.findOne({ id, userId: req.user._id }).lean();
    if (!marketDoc) return res.status(404).json({ success: false, message: "Crew team not found" });

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) return res.status(404).json({ success: false, message: "Studio not found" });

    const signingFee = calculateSigningFee(marketDoc);
    if (Number(studio.money || 0) < signingFee) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds: hiring ${marketDoc.name} requires a signing fee of ${signingFee}, but the studio has ${studio.money}.`,
        signingFee,
        studioMoney: studio.money,
      });
    }

    const hiredCrew = { ...marketDoc };
    hiredCrew.hiredAt = new Date();
    hiredCrew.status = "AVAILABLE";

    await MarketCrewTeam.deleteOne({ _id: marketDoc._id });
    gameState.ownedCrewTeams = gameState.ownedCrewTeams || [];
    gameState.ownedCrewTeams.push(hiredCrew);

    await Notification.create({
      gameStateId: gameState._id,
      message: `${hiredCrew.name} has been hired.`,
      createdAt: new Date(),
    });

    invalidateUserCache(String(req.user._id));
    studio.money = Math.max(0, Number(studio.money || 0) - signingFee);
    await studio.save();
    await gameState.save();

    const updatedMarket = await MarketCrewTeam.find({ userId: req.user._id }).lean();
    res.status(200).json({ success: true, message: "Crew team hired", crewTeam: hiredCrew, signingFee, remainingMoney: studio.money, marketCrewTeams: updatedMarket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCrewProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const gameState = await findGameState(req.user._id);
    if (!gameState) return res.status(404).json({ success: false, message: "Game state not found" });

    let crew = gameState.ownedCrewTeams?.find((c) => c.id === id);
    if (!crew) {
      const marketDoc = await MarketCrewTeam.findOne({ id, userId: req.user._id }).lean();
      if (marketDoc) crew = marketDoc;
    }

    if (!crew) return res.status(404).json({ success: false, message: "Crew team not found" });

    return res.status(200).json({ success: true, profile: crew });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const evaluateCrewImpact = async (req, res, next) => {
  try {
    const { technicalQuality, vfxQuality, creativity, reliability, morale } = req.body;
    const impact = CrewTeamEngine.calculateProductionImpact({
      technicalQuality,
      vfxQuality,
      creativity,
      reliability,
      morale,
    });
    res.status(200).json({ success: true, data: impact });
  } catch (error) {
    next(error);
  }
};

export const checkCrewAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const gameState = await findGameState(req.user._id);
    if (!gameState) return res.status(404).json({ success: false, message: "Game state not found" });

    const crew = (gameState.ownedCrewTeams || []).find((c) => c.id === id);
    if (!crew) return res.status(404).json({ success: false, message: "Crew team not found" });

    const availability = CrewTeamEngine.checkConflictAndOverbooking(crew, gameState.currentWeek);
    res.status(200).json({ success: true, data: availability });
  } catch (error) {
    next(error);
  }
};

export const fireCrewTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const gameState = await findGameState(req.user._id);
    const studio = await Studio.findOne({ owner: req.user._id });

    if (!gameState || !studio) return res.status(404).json({ success: false, message: "Game state or studio not found" });

    const index = gameState.ownedCrewTeams.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Crew team not found" });
    const crewTeam = gameState.ownedCrewTeams[index];

    if (crewTeam.status === "BUSY") {
      return res.status(400).json({ success: false, message: "Crew team is busy on a project" });
    }

    const firedCrew = crewTeam.toObject ? crewTeam.toObject() : { ...crewTeam };
    firedCrew.hiredAt = null;

    gameState.ownedCrewTeams.splice(index, 1);
    await MarketCrewTeam.create([{ ...firedCrew, userId: req.user._id }]);

    await Notification.create({
      gameStateId: gameState._id,
      message: `${firedCrew.name} has been fired.`,
      createdAt: new Date(),
    });

    invalidateUserCache(String(req.user._id));
    await gameState.save();

    const updatedMarket = await MarketCrewTeam.find({ userId: req.user._id }).lean();
    res.status(200).json({ success: true, message: "Crew team fired", marketCrewTeams: updatedMarket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
