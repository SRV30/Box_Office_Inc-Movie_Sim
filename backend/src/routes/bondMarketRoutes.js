import express from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { issueBondSchema } from "../validators/gameplayValidators.js";
import {
  evaluateStudioCredit,
  issueStudioBond,
  getStudioBonds,
  triggerWeeklyBondProcessing,
} from "../controllers/bondMarketController.js";

const router = express.Router();

router.use(protect);

router.get("/credit-eval", evaluateStudioCredit);
router.post("/issue", validate(issueBondSchema), issueStudioBond);
router.get("/bonds", getStudioBonds);
// Internal scheduler / admin operations endpoint only
router.post("/process-weekly", requireRole("admin", "operations"), triggerWeeklyBondProcessing);

export default router;
