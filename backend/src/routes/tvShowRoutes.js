import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getTVShows,
  getTVShowById,
  createTVShow,
  renewTVShowSeason,
  syndicateTVShow,
  checkTalentConflictAPI,
} from "../controllers/tvShowController.js";

const router = express.Router();

router.use(protect);

router.get("/", getTVShows);
router.post("/", createTVShow);
router.get("/check-conflict/:talentId", checkTalentConflictAPI);
router.get("/:id", getTVShowById);
router.post("/:id/renew", renewTVShowSeason);
router.post("/:id/syndicate", syndicateTVShow);

export default router;
