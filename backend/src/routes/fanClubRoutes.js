import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getFanClubDetails, updateFanClubBudget, hostConvention } from "../controllers/fanClubController.js";

const router = express.Router();

router.get("/", protect, getFanClubDetails);
router.put("/budget", protect, updateFanClubBudget);
router.post("/convention", protect, hostConvention);

export default router;
