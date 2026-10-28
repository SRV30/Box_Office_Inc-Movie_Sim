/**
 * @fileoverview Film Festival Routes
 */

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  submitToFestival,
  getActiveSubmissions,
  withdrawSubmission,
  acceptDistributionDeal,
  getFestivalLaurels,
} from "../controllers/festivalController.js";
import {
  validateFestivalSubmissionSchema,
  validateFestivalWithdrawSchema,
  validateFestivalDealSchema,
} from "../validators/festivalValidator.js";
import { validate } from "../middleware/validationMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/submit", validate(validateFestivalSubmissionSchema), submitToFestival);
router.get("/active", getActiveSubmissions);
router.get("/laurels", getFestivalLaurels);
router.post("/withdraw", validate(validateFestivalWithdrawSchema), withdrawSubmission);
router.post("/accept-deal", validate(validateFestivalDealSchema), acceptDistributionDeal);

export default router;

