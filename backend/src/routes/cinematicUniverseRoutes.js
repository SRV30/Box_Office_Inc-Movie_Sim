import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createCinematicUniverse,
  addMovieToUniverse,
  getStudioUniverses,
  getUniverseSynergyEval,
} from "../controllers/cinematicUniverseController.js";

const router = express.Router();

router.use(protect);

router.post("/universes", createCinematicUniverse);
router.post("/universes/add-movie", addMovieToUniverse);
router.get("/universes", getStudioUniverses);
router.get("/synergy-eval", getUniverseSynergyEval);

export default router;
