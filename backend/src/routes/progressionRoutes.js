import express from "express";
import {
  getAchievements,
  getHallOfFame,
  getEndgameReport,
} from "../controllers/progressionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/achievements", protect, getAchievements);
router.get("/hall-of-fame", protect, getHallOfFame);
router.get("/endgame-report", protect, getEndgameReport);

export default router;
