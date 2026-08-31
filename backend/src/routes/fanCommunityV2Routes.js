import express from "express";
import { getFanCommunities, handleTriggerReviewBombing } from "../controllers/fanCommunityV2Controller.js";

const router = express.Router();

router.get("/:gameStateId", getFanCommunities);
router.post("/review-bomb", handleTriggerReviewBombing);

export default router;
