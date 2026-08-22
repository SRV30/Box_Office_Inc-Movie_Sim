import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { updateFanClubBudgetSchema } from "../validators/gameplayValidators.js";
import { getFanClubDetails, updateFanClubBudget, hostConvention } from "../controllers/fanClubController.js";

const router = express.Router();

router.get("/", protect, getFanClubDetails);
router.put("/budget", protect, validate(updateFanClubBudgetSchema), updateFanClubBudget);
router.post("/convention", protect, hostConvention);

export default router;
