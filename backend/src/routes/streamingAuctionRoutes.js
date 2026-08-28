import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { createAuctionSchema, executeAuctionBidSchema } from "../validators/gameplayValidators.js";
import { submitCounterofferSchema } from "../validators/streamingWarsValidators.js";
import {
  createStreamingAuction,
  executeAuctionBidding,
  getStudioAuctions,
  submitCounteroffer,
  getStreamingPlatforms,
  getStreamingRights,
  getStreamingWarsAnalytics,
} from "../controllers/streamingAuctionController.js";

const router = express.Router();

router.use(protect);

router.get("/platforms", getStreamingPlatforms);
router.get("/rights", getStreamingRights);
router.get("/analytics", getStreamingWarsAnalytics);
router.post("/auctions", validate(createAuctionSchema), createStreamingAuction);
router.post("/auctions/:auctionId/bid", validate(executeAuctionBidSchema), executeAuctionBidding);
router.post("/auctions/:auctionId/counteroffer", validate(submitCounterofferSchema), submitCounteroffer);
router.get("/auctions", getStudioAuctions);

export default router;
