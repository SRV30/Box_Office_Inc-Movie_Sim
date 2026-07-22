import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { launchPreSales, getPreSales } from "../controllers/preSalesController.js";

const router = express.Router();
router.post("/launch", protect, launchPreSales);
router.get("/", protect, getPreSales);
export default router;
