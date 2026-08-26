import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAvailableComposers,
  getStudioComposers,
  hireComposer,
  releaseComposerContract,
  evaluateMusicImpact,
} from "../controllers/composerController.js";

const router = express.Router();

router.get("/market", protect, getAvailableComposers);
router.get("/roster", protect, getStudioComposers);
router.post("/hire", protect, hireComposer);
router.post("/:composerId/release", protect, releaseComposerContract);
router.post("/evaluate-impact", protect, evaluateMusicImpact);

export default router;
