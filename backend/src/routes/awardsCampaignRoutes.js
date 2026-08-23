import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { startAwardsCampaignSchema } from "../validators/gameplayValidators.js";
import { startAwardsCampaign } from "../controllers/awardsCampaignController.js";

const router = express.Router();

router.use(protect);

router.post("/lobby", validate(startAwardsCampaignSchema), startAwardsCampaign);

export default router;
