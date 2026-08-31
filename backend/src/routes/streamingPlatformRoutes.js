import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAllPlatforms,
  getMyPlatform,
  launchPlayerPlatform,
  updatePlatformConfig,
  licenseContentToPlatform,
  upgradeRecommendationTech,
} from "../controllers/streamingPlatformController.js";

const router = express.Router();

router.use(protect);

router.get("/", getAllPlatforms);
router.get("/my-platform", getMyPlatform);
router.post("/launch", launchPlayerPlatform);
router.put("/:id/pricing", updatePlatformConfig);
router.post("/:id/license", licenseContentToPlatform);
router.post("/:id/upgrade-recommendations", upgradeRecommendationTech);

export default router;
