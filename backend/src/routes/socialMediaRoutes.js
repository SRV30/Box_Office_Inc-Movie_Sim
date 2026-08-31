import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
  updateSocialBudgetSchema,
  launchSocialCampaignSchema,
} from "../validators/socialMediaValidators.js";
import {
  getSocialAccounts,
  updateSocialBudget,
  createSocialCampaign,
  getSocialEvents,
  getSocialAnalytics,
  getCampaignEligibleMovies,
} from "../controllers/socialMediaController.js";

const router = express.Router();

router.get("/accounts", protect, getSocialAccounts);
router.put("/accounts/:platform/budget", protect, validate(updateSocialBudgetSchema), updateSocialBudget);
router.post("/campaigns", protect, validate(launchSocialCampaignSchema), createSocialCampaign);
router.get("/events", protect, getSocialEvents);
router.get("/analytics", protect, getSocialAnalytics);
router.get("/movies", protect, getCampaignEligibleMovies);

export default router;
