import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { merchandiseValuationSchema, merchandiseDealSchema } from "../validators/gameplayValidators.js";
import {
  createMerchandiseDeal,
  getStudioMerchandiseDeals,
  getMerchandiseValuation,
  triggerWeeklyMerchandiseProcessing,
} from "../controllers/merchandiseController.js";

const router = express.Router();

router.use(protect);

router.post("/valuation", validate(merchandiseValuationSchema), getMerchandiseValuation);
router.post("/deals", validate(merchandiseDealSchema), createMerchandiseDeal);
router.get("/deals", getStudioMerchandiseDeals);
router.post("/process-weekly", triggerWeeklyMerchandiseProcessing);

export default router;
