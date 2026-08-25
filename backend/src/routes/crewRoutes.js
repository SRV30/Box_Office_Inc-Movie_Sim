import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { checkNegativeBalance } from "../middleware/balanceMiddleware.js";
import {
  getMarketCrewTeams,
  getOwnedCrewTeams,
  getCrewProfile,
  hireCrewTeam,
  fireCrewTeam,
  evaluateCrewImpact,
  checkCrewAvailability,
} from "../controllers/crewController.js";

const router = express.Router();

router.get("/", protect, getMarketCrewTeams);
router.get("/owned", protect, getOwnedCrewTeams);
router.post("/evaluate-impact", protect, evaluateCrewImpact);
router.get("/:id/availability", protect, checkCrewAvailability);
router.get("/:id", protect, getCrewProfile);
router.post("/hire/:id", protect, checkNegativeBalance, hireCrewTeam);
router.post("/fire/:id", protect, fireCrewTeam);

export default router;
