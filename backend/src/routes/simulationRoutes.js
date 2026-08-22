import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { simulateWeekSchema } from "../validators/gameplayValidators.js";
import { simulateWeek, getPastAwards, getMarketIntelligence, resetGame } from "../controllers/simulationController.js";

const router = express.Router();

router.post("/next-week", protect, validate(simulateWeekSchema), simulateWeek);
router.get("/awards", protect, getPastAwards);
router.get("/market-intelligence", protect, getMarketIntelligence);
router.post("/reset", protect, resetGame);

export default router;
