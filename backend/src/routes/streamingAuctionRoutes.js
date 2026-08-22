import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { createAuctionSchema, executeAuctionBidSchema } from "../validators/gameplayValidators.js";
import {
  createStreamingAuction,
  executeAuctionBidding,
  getStudioAuctions,
} from "../controllers/streamingAuctionController.js";

const router = express.Router();

router.use(protect);

router.post("/auctions", validate(createAuctionSchema), createStreamingAuction);
router.post("/auctions/:auctionId/bid", validate(executeAuctionBidSchema), executeAuctionBidding);
router.get("/auctions", getStudioAuctions);

export default router;
