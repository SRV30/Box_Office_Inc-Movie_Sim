import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getStudioLedger,
  createLedgerReversal,
} from "../controllers/financialLedgerController.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getStudioLedger);
router.post("/reversal", createLedgerReversal);

export default router;
