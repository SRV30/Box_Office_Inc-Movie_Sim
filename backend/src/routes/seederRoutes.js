import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { seedIndustry, getSeedValidationReport } from "../controllers/seederController.js";

const router = express.Router();

router.post("/seed-market", protect, seedIndustry);
router.get("/validation-report", protect, getSeedValidationReport);

export default router;
