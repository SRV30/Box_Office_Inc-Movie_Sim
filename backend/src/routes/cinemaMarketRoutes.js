import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
  setMovieTargetMarketsSchema,
  projectMarketRevenueSchema,
} from "../validators/cinemaMarketValidators.js";
import {
  getCinemaMarkets,
  getStudioMarketMovies,
  setMovieTargetMarkets,
  getMovieMarketProjections,
  getCinemaMarketAnalytics,
} from "../controllers/cinemaMarketController.js";

const router = express.Router();

router.get("/", protect, getCinemaMarkets);
router.get("/movies", protect, getStudioMarketMovies);
router.get("/analytics", protect, getCinemaMarketAnalytics);
router.put("/movies/:movieId/targets", protect, validate(setMovieTargetMarketsSchema), setMovieTargetMarkets);
router.get("/movies/:movieId/projections", protect, validate(projectMarketRevenueSchema), getMovieMarketProjections);

export default router;
