import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getTutorialState,
  advanceTutorial,
  skipTutorial,
  replayTutorial,
  dismissTooltip,
} from "../controllers/tutorialController.js";

const router = express.Router();

router.get("/state", protect, getTutorialState);
router.post("/advance", protect, advanceTutorial);
router.post("/skip", protect, skipTutorial);
router.post("/replay", protect, replayTutorial);
router.post("/dismiss-tooltip", protect, dismissTooltip);

export default router;
