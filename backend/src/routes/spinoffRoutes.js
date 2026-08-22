import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { createSpinoffSchema, createCrossoverSchema } from "../validators/gameplayValidators.js";
import { createSpinoff, createCrossover, getUniverseSynergy } from "../controllers/spinoffController.js";

const router = express.Router();

// Create a spin-off franchise from an existing one
router.post("/:id/spinoff", protect, validate(createSpinoffSchema), createSpinoff);

// Create a crossover franchise from two existing ones
router.post("/crossover", protect, validate(createCrossoverSchema), createCrossover);

// Get universe synergy metrics
router.get("/universe-synergy/:franchiseId", protect, getUniverseSynergy);

export default router;
