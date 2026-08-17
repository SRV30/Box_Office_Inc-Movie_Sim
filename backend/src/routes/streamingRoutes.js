import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
  acceptStreamingDealSchema,
  streamingStrategyParamsSchema,
  streamingCatalogQuerySchema,
} from "../validators/streamingValidators.js";
import {
  getPlatforms,
  getStreamingCatalog,
  acceptStreamingDeal,
  getStreamingStrategy,
} from "../controllers/streamingController.js";

const router = express.Router();

router.get("/platforms", protect, getPlatforms);
router.get("/catalog", protect, validate(streamingCatalogQuerySchema), getStreamingCatalog);
router.get("/movies/:movieId/strategy", protect, validate(streamingStrategyParamsSchema), getStreamingStrategy);
router.post("/movies/:movieId/accept-deal", protect, validate(acceptStreamingDealSchema), acceptStreamingDeal);

export default router;
