import express from "express";
import {
  getAchievements,
  getHallOfFame,
  getEndgameReport,
} from "../controllers/progressionController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/achievements", authMiddleware, getAchievements);
router.get("/hall-of-fame", authMiddleware, getHallOfFame);
router.get("/endgame-report", authMiddleware, getEndgameReport);

export default router;
