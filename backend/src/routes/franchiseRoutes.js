import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getFranchises,
  getFranchiseById,
  createFranchise,
  getFranchiseTimeline,
  getFranchiseRankings,
} from "../controllers/franchiseController.js";

const router = express.Router();

router.get("/", protect, getFranchises);
router.get("/rankings", protect, getFranchiseRankings);
router.get("/:id/timeline", protect, getFranchiseTimeline);
router.post("/", protect, createFranchise);
router.get("/:id", protect, getFranchiseById);

export default router;
