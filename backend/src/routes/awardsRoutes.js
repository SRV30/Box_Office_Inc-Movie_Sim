import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  launchAwardsCampaign,
  getStudioAwardsCampaigns,
  triggerAwardsCeremony,
} from "../controllers/awardsController.js";

const router = express.Router();

router.use(protect);

router.post("/campaigns", launchAwardsCampaign);
router.get("/campaigns", getStudioAwardsCampaigns);
router.post("/ceremony", triggerAwardsCeremony);

export default router;
