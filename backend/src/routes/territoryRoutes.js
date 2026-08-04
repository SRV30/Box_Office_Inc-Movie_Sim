import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validationMiddleware.js";
import {
  getStudioTerritoryDeals,
  getTerritoryOffer,
  signTerritoryDeal,
} from "../controllers/territoryController.js";
import { signTerritoryDealSchema } from "../validators/territoryValidators.js";

const router = express.Router();

router.use(protect);

router.get("/deals", getStudioTerritoryDeals);
router.get("/offer", getTerritoryOffer);
router.post("/sign", validateRequest(signTerritoryDealSchema), signTerritoryDeal);

export default router;
