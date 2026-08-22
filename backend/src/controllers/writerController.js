import GameState from "../models/GameState.js";
import Studio from "../models/Studio.js";
import { generateWriters } from "../services/writer/writerGenerator.js";
import { buildWriterProfile } from "../services/writer/writerProfileService.js";
import { presentWriters } from "../services/writer/writerPresenter.js";
import crypto from "node:crypto";
import { getMarketplaceTalent, resolveTalent, invalidateUserCache } from "../utils/marketplaceHelper.js";
import Notification from "../models/Notification.js";
import { calculateSigningFee } from "../services/talent/signingFeeService.js";
import TalentHistory from "../models/TalentHistory.js";

export const getMarketWriters = async (req, res) => {
  const gameState = await GameState.findOne({
    user: req.user._id,
  }).select("marketWriters").lean();

  if (!gameState) {
    return res.status(404).json({
      message: "Game state not found",
    });
  }

  if (!gameState.marketWriters || gameState.marketWriters.length === 0) {
    const freshGameState = await GameState.findOne({ user: req.user._id });
    freshGameState.marketWriters = generateWriters(50);
    await freshGameState.save();
    const result = getMarketplaceTalent(freshGameState.marketWriters, req.query);
    return res.status(200).json({
      writers: presentWriters(result.items),
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  }

  const result = getMarketplaceTalent(gameState.marketWriters, req.query);
  res.status(200).json({
    writers: presentWriters(result.items),
    pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
  });
};

export const getOwnedWriters = async (req, res) => {
  const gameState = await GameState.findOne({
    user: req.user._id,
  }).select("ownedWriters").lean();

  if (!gameState) {
    return res.status(404).json({
      message: "Game state not found",
    });
  }

  res.status(200).json({
    writers: presentWriters(gameState.ownedWriters),
  });
};


export const getWriterProfile = async (req, res) => {
  const { writerId } = req.params;

  const gameState = await GameState.findOne({
    user: req.user._id,
  });

  if (!gameState) {
    return res.status(404).json({
      message: "Game state not found",
    });
  }

  const writer =
    gameState.ownedWriters.find((w) => w.id === writerId) ||
    gameState.marketWriters.find((w) => w.id === writerId);

  if (!writer) {
    return res.status(404).json({
      message: "Writer not found",
    });
  }

  const histories = await TalentHistory.find({
    gameStateId: gameState._id,
    talentId: writer.id,
  }).lean();

  writer.careerHistory = histories.filter((h) => h.type === "CAREER").map((h) => h.data);
  writer.salaryHistory = histories.filter((h) => h.type === "SALARY").map((h) => h.data);
  writer.awardsHistory = histories.filter((h) => h.type === "AWARD").map((h) => h.data);

  res.status(200).json({
    profile: buildWriterProfile(writer),
  });
};

export const hireWriter = async (req, res) => {
  const { index } = req.params;

  const gameState = await GameState.findOne({
    user: req.user._id,
  });

  if (!gameState) {
    return res.status(404).json({
      message: "Game state not found",
    });
  }

  const { item: writer, index: realIndex } = resolveTalent(
    gameState.marketWriters || [],
    index
  );

  if (!writer) {
    return res.status(404).json({
      message: "Writer not found",
    });
  }

  const studio = await Studio.findOne({ owner: req.user._id });

  if (!studio) {
    return res.status(404).json({
      message: "Studio not found",
    });
  }

  const signingFee = calculateSigningFee(writer);

  if (Number(studio.money || 0) < signingFee) {
    return res.status(400).json({
      message: `Insufficient funds: hiring ${writer.name} requires a signing fee of ${signingFee}, but the studio has ${studio.money}.`,
      signingFee,
      studioMoney: studio.money,
    });
  }

  writer.hiredAt = new Date();

  gameState.ownedWriters.push(writer);

  gameState.marketWriters.splice(realIndex, 1);

  studio.money = Math.max(0, Number(studio.money || 0) - signingFee);
  await studio.save();

  await gameState.save();

  res.status(200).json({
    message: "Writer hired successfully",
    signingFee,
    remainingMoney: studio.money,
  });
};

export const fireWriter = async (req, res) => {
  const { index } = req.params;

  const gameState = await GameState.findOne({
    user: req.user._id,
  });

  const studio = await Studio.findOne({
    owner: req.user._id,
  });

  if (!gameState) {
    return res.status(404).json({
      message: "Game state not found",
    });
  }

  if (!studio) {
    return res.status(404).json({
      message: "Studio not found",
    });
  }

  const { item: writer, index: realIndex } = resolveTalent(
    gameState.ownedWriters || [],
    index
  );

  if (!writer) {
    return res.status(404).json({
      message: "Writer not found",
    });
  }

  const activeProject = gameState.activeWritingProjects.find(
    (project) => project.writerId === writer.id
  );

  let penalty = 50000;
  let fanLoss = 0;

  if (activeProject) {
    const totalDuration =
      activeProject.completionWeek - activeProject.startWeek;

    const elapsedWeeks = gameState.currentWeek - activeProject.startWeek;

    const progress = Math.min(
      100,
      Math.floor((elapsedWeeks / totalDuration) * 100)
    );

    if (progress >= 75) {
      penalty = 100000;
      fanLoss = 100;
    } else if (progress >= 50) {
      penalty = 90000;
      fanLoss = 50;
    } else if (progress >= 25) {
      penalty = 75000;
      fanLoss = 25;
    } else {
      penalty = 60000;
      fanLoss = 10;
    }

    gameState.activeWritingProjects = gameState.activeWritingProjects.filter(
      (project) => project.writerId !== writer.id
    );

    await Notification.create({
      gameStateId: gameState._id,
      message: `${writer.name} was fired while writing a script. Project cancelled.`,
    });
  }

  studio.money = Math.max(0, studio.money - penalty);

  studio.fans = Math.max(0, studio.fans - fanLoss);

  writer.status = "AVAILABLE";
  writer.busyUntilWeek = null;

  gameState.marketWriters.push(writer);

  gameState.ownedWriters.splice(realIndex, 1);

  await Notification.create({
    gameStateId: gameState._id,
    message: `${
      writer.name
    } was fired. Penalty ₹${penalty.toLocaleString()} and ${fanLoss} fans lost.`,
  });

  await studio.save();
  await gameState.save();

  res.status(200).json({
    message: "Writer fired successfully",
    penalty,
    fanLoss,
    remainingMoney: studio.money,
    remainingFans: studio.fans,
  });
};

export const startWritingProject = async (req, res) => {
  const { writerId, genre, targetAudience } = req.body;

  const gameState = await GameState.findOne({
    user: req.user._id,
  });

  if (!gameState) {
    return res.status(404).json({
      message: "Game state not found",
    });
  }

  const writer = gameState.ownedWriters.find((w) => w.id === writerId);

  if (!writer) {
    return res.status(404).json({
      message: "Writer not found",
    });
  }

  if (writer.status !== "AVAILABLE") {
    return res.status(400).json({
      message: "Writer already busy",
    });
  }

  const duration = Math.floor(Math.random() * 4) + 2;

  const project = {
    id: crypto.randomUUID(),

    writerId: writer.id,

    writerName: writer.name,

    genre,

    targetAudience,

    startWeek: gameState.currentWeek,

    completionWeek: gameState.currentWeek + duration,

    progress: 0,

    status: "WRITING",
  };

  writer.status = "WRITING";

  writer.busyUntilWeek = project.completionWeek;

  gameState.activeWritingProjects.push(project);

  await gameState.save();

  res.status(201).json({
    project,
  });
};

export const getWritingProjects = async (req, res) => {
  const gameState = await GameState.findOne({
    user: req.user._id,
  });

  if (!gameState) {
    return res.status(404).json({
      message: "Game state not found",
    });
  }

  res.status(200).json({
    projects: gameState.activeWritingProjects,
  });
};

export const replaceWriter = async (req, res) => {
  const { oldWriterId, newWriterId } = req.body;

  const gameState = await GameState.findOne({
    user: req.user._id,
  });

  if (!gameState) {
    return res.status(404).json({
      message: "Game state not found",
    });
  }

  const project = gameState.activeWritingProjects.find(
    (p) => p.writerId === oldWriterId
  );

  if (!project) {
    return res.status(404).json({
      message: "Project not found",
    });
  }

  const oldWriter = gameState.ownedWriters.find((w) => w.id === oldWriterId);

  const newWriter = gameState.ownedWriters.find((w) => w.id === newWriterId);

  if (!newWriter) {
    return res.status(404).json({
      message: "Replacement writer not found",
    });
  }

  if (newWriter.status !== "AVAILABLE") {
    return res.status(400).json({
      message: "Writer already busy",
    });
  }

  let penalty = 2;

  if (project.progress >= 75) {
    penalty = 15;
  } else if (project.progress >= 50) {
    penalty = 10;
  } else if (project.progress >= 25) {
    penalty = 5;
  }

  project.writerId = newWriter.id;

  project.writerName = newWriter.name;

  project.qualityPenalty += penalty;

  newWriter.status = "WRITING";

  newWriter.busyUntilWeek = project.completionWeek;

  if (oldWriter) {
    oldWriter.status = "AVAILABLE";

    oldWriter.busyUntilWeek = null;
  }

  await Notification.create({
    gameStateId: gameState._id,
    message: `${oldWriter?.name} left the project. ${newWriter.name} replaced them. Script quality -${penalty}.`,
  });

  await gameState.save();

  res.status(200).json({
    message: "Writer replaced successfully",
    qualityPenalty: project.qualityPenalty,
  });
};
