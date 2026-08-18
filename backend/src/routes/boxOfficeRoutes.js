/**
 * @fileoverview Box Office Routes
 * 
 * Express routing definitions for Box Office Telemetry and Analytics API endpoints.
 */

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
  validateBoxOfficeAnalyticsSchema,
  validateClashAnalyticsSchema,
} from "../validators/boxOfficeValidator.js";
import {
  getBoxOfficeAnalytics,
  getRegionalSummary,
  getBoxOfficeClashAnalytics,
} from "../controllers/boxOfficeController.js";

const router = express.Router();

router.use(protect);

router.get("/analytics/:movieId", validate(validateBoxOfficeAnalyticsSchema), getBoxOfficeAnalytics);
router.get("/clash-analytics/:movieId", validate(validateClashAnalyticsSchema), getBoxOfficeClashAnalytics);
router.get("/regional-summary", getRegionalSummary);

export default router;
