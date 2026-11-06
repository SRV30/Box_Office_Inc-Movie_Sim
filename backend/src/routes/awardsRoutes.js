import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getStudioAwards,
  launchAwardsCampaign,
  getStudioAwardsCampaigns,
  triggerAwardsCeremony,
} from "../controllers/awardsController.js";

const router = express.Router();

router.use(protect);

router.get("/", getStudioAwards);
router.post("/campaigns", launchAwardsCampaign);
router.get("/campaigns", getStudioAwardsCampaigns);
router.post("/ceremony", triggerAwardsCeremony);

export default router;
