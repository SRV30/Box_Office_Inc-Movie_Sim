import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { launchPRCampaignSchema } from "../validators/gameplayValidators.js";
import { launchPRCampaign, getPRStatus } from "../controllers/prController.js";

const router = express.Router();

router.get("/pr/status", protect, getPRStatus);
router.post("/pr/campaign", protect, validate(launchPRCampaignSchema), launchPRCampaign);

export default router;
