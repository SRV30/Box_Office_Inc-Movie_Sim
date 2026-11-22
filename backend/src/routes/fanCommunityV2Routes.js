import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getFanCommunities, handleTriggerReviewBombing } from "../controllers/fanCommunityV2Controller.js";

const router = express.Router();

router.use(protect);

router.get("/:gameStateId?", getFanCommunities);
router.post("/review-bomb", handleTriggerReviewBombing);

export default router;
