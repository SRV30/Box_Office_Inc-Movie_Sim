import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
  createCinematicUniverseSchema,
  addMovieToUniverseSchema,
} from "../validators/gameplayValidators.js";
import {
  createCinematicUniverse,
  addMovieToUniverse,
  getStudioUniverses,
  getUniverseSynergyEval,
} from "../controllers/cinematicUniverseController.js";

const router = express.Router();

router.use(protect);

router.post("/universes", validate(createCinematicUniverseSchema), createCinematicUniverse);
router.post("/universes/add-movie", validate(addMovieToUniverseSchema), addMovieToUniverse);
router.get("/universes", getStudioUniverses);
router.get("/synergy-eval", getUniverseSynergyEval);

export default router;
