import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getFinancialAnalytics,
  getMoviePerformanceReports,
  getGenreAnalytics,
  getTalentCareerTrajectories,
  getRivalComparisons,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/financials", protect, getFinancialAnalytics);
router.get("/movies", protect, getMoviePerformanceReports);
router.get("/genres", protect, getGenreAnalytics);
router.get("/talent", protect, getTalentCareerTrajectories);
router.get("/rivals", protect, getRivalComparisons);

export default router;
