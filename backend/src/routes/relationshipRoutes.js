import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getTalentRelationships,
  evaluateCandidateCastChemistry,
  createOrUpdateRelationship,
} from "../controllers/relationshipController.js";

const router = express.Router();

router.get("/", protect, getTalentRelationships);
router.post("/cast-chemistry", protect, evaluateCandidateCastChemistry);
router.post("/", protect, createOrUpdateRelationship);

export default router;
