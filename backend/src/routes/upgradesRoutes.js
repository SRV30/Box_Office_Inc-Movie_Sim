import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { buyUpgradeSchema } from "../validators/gameplayValidators.js";
import { getUpgrades, buyUpgrade } from "../controllers/upgradesController.js";

const router = express.Router();

router.use(protect);

router.get("/", getUpgrades);
router.post("/buy", validate(buyUpgradeSchema), buyUpgrade);

export default router;
