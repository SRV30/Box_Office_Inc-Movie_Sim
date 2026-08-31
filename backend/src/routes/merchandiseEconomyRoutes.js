import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getStudioProducts,
  getEligibleIPs,
  launchProductLine,
  restockProductInventory,
  updateProductPricing,
  liquidateStock,
} from "../controllers/merchandiseEconomyController.js";

const router = express.Router();

router.use(protect);

router.get("/", getStudioProducts);
router.get("/eligible-ip", getEligibleIPs);
router.post("/launch", launchProductLine);
router.post("/:id/restock", restockProductInventory);
router.put("/:id/pricing", updateProductPricing);
router.post("/:id/liquidate", liquidateStock);

export default router;
