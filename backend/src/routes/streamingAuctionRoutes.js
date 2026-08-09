import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createStreamingAuction,
  executeAuctionBidding,
  getStudioAuctions,
} from "../controllers/streamingAuctionController.js";

const router = express.Router();

router.use(protect);

router.post("/auctions", createStreamingAuction);
router.post("/auctions/:auctionId/bid", executeAuctionBidding);
router.get("/auctions", getStudioAuctions);

export default router;
