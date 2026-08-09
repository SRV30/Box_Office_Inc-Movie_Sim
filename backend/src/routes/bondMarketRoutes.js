import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  evaluateStudioCredit,
  issueStudioBond,
  getStudioBonds,
  triggerWeeklyBondProcessing,
} from "../controllers/bondMarketController.js";

const router = express.Router();

router.use(protect);

router.get("/credit-eval", evaluateStudioCredit);
router.post("/issue", issueStudioBond);
router.get("/bonds", getStudioBonds);
router.post("/process-weekly", triggerWeeklyBondProcessing);

export default router;
