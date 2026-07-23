import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMerchandiseLines,
  launchMerchandiseLine,
  launchSeasonalCampaign
} from "../controllers/merchandiseLinesController.js";

const router = express.Router();

router.get("/lines", protect, getMerchandiseLines);
router.post("/lines", protect, launchMerchandiseLine);
router.post("/lines/:lineId/campaign", protect, launchSeasonalCampaign);

export default router;
