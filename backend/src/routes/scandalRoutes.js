import express from "express";
import {
  getStudioScandals,
  getActiveScandals,
  getAvailableStrategies,
  triggerScandal,
  respondToScandal,
  getMovieScandalImpact,
} from "../controllers/scandalController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/strategies", getAvailableStrategies);
router.get("/impact/movie/:movieId", getMovieScandalImpact);

router.use(protect);

router.get("/", getStudioScandals);
router.get("/active", getActiveScandals);
router.post("/trigger", triggerScandal);
router.post("/:id/respond", respondToScandal);

export default router;
