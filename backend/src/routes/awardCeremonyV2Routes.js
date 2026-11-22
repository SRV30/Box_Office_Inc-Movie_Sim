import express from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import {
  getCeremonyHistory,
  getCeremonyConfigs,
  triggerCeremonyEvaluation,
} from "../controllers/awardCeremonyV2Controller.js";

const router = express.Router();

// Public / reference configs
router.get("/configs", getCeremonyConfigs);

// Protected routes
router.get("/history/:gameStateId?", protect, getCeremonyHistory);
router.post("/trigger", protect, requireRole("admin", "operations"), triggerCeremonyEvaluation);

export default router;
