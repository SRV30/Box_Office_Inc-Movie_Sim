import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { financialForecastQuerySchema } from "../validators/financialForecastValidator.js";
import {
  getFinancialAnalytics,
  getFinancialForecast,
  getMoviePerformanceReports,
  getMovieProfitabilitySummary,
  getGenreAnalytics,
  getTalentCareerTrajectories,
  getRivalComparisons,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/financials", protect, getFinancialAnalytics);
router.get(
  "/financials/forecast",
  protect,
  validate(financialForecastQuerySchema),
  getFinancialForecast
);
router.get("/movies", protect, getMoviePerformanceReports);
router.get(
  "/movies/:movieId/profitability",
  protect,
  getMovieProfitabilitySummary
);
router.get("/genres", protect, getGenreAnalytics);
router.get("/talent", protect, getTalentCareerTrajectories);
router.get("/rivals", protect, getRivalComparisons);

export default router;
