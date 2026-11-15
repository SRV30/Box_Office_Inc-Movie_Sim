import express from "express";
import crypto from "crypto";
import SimulationJob from "../models/SimulationJob.js";
import GameState from "../models/GameState.js";
import Studio from "../models/Studio.js";
import { runWeeklySimulation } from "../services/simulation/runWeeklySimulation.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * POST /api/simulation/jobs
 * Enqueue a simulation tick in the durable background queue.
 */
router.post("/jobs", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const existingActive = await SimulationJob.findOne({
      userId,
      status: { $in: ["QUEUED", "RUNNING"] },
    });

    if (existingActive) {
      return res.status(409).json({
        success: false,
        message: "A simulation job is already in progress for this studio",
        jobId: existingActive.jobId,
        status: existingActive.status,
      });
    }

    const gameState = await GameState.findOne({ user: userId });
    const studio = await Studio.findOne({ owner: userId });

    if (!gameState || !studio) {
      return res.status(404).json({
        success: false,
        message: "Game state or studio not found",
      });
    }

    const jobId = `sim-job-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const job = await SimulationJob.create({
      jobId,
      userId,
      studioId: studio._id,
      targetWeek: gameState.currentWeek + 1,
      status: "QUEUED",
    });

    // Execute job asynchronously in background (simulating worker queue)
    setImmediate(async () => {
      try {
        job.status = "RUNNING";
        job.startedAt = new Date();
        await job.save();

        const simResult = await runWeeklySimulation(gameState, studio);
        await gameState.save();
        await studio.save();

        job.status = "COMPLETED";
        job.completedAt = new Date();
        job.result = {
          currentWeek: gameState.currentWeek,
          summary: simResult,
        };
        await job.save();
      } catch (err) {
        job.status = "FAILED";
        job.completedAt = new Date();
        job.error = err.message;
        await job.save();
      }
    });

    return res.status(202).json({
      success: true,
      message: "Simulation job successfully enqueued",
      jobId: job.jobId,
      targetWeek: job.targetWeek,
      status: job.status,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/simulation/jobs/:jobId
 * Check the status and output of a background simulation job.
 */
router.get("/jobs/:jobId", protect, async (req, res) => {
  try {
    const job = await SimulationJob.findOne({
      jobId: req.params.jobId,
      userId: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Simulation job not found",
      });
    }

    return res.status(200).json({
      success: true,
      job: {
        jobId: job.jobId,
        status: job.status,
        targetWeek: job.targetWeek,
        result: job.result,
        error: job.error,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
