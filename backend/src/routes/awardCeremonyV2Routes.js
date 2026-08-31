import express from "express";
import { getCeremonyHistory, getCeremonyConfigs, triggerCeremonyEvaluation } from "../controllers/awardCeremonyV2Controller.js";

const router = express.Router();

router.get("/configs", getCeremonyConfigs);
router.get("/history/:gameStateId", getCeremonyHistory);
router.post("/trigger", triggerCeremonyEvaluation);

export default router;
