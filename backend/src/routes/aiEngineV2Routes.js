import express from "express";
import { getAIStrategiesV2, updateAIStrategyV2 } from "../controllers/aiEngineV2Controller.js";

const router = express.Router();

router.get("/:gameStateId", getAIStrategiesV2);
router.post("/update", updateAIStrategyV2);

export default router;
