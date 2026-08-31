import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getStudioUniverses,
  getUniverseById,
  createUniverse,
  addCanonEntry,
  toggleHiatus,
} from "../controllers/franchiseV2Controller.js";

const router = express.Router();

router.use(protect);

router.get("/", getStudioUniverses);
router.post("/", createUniverse);
router.get("/:id", getUniverseById);
router.post("/:id/entries", addCanonEntry);
router.post("/:id/hiatus", toggleHiatus);

export default router;
