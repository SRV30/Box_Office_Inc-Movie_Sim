import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { exportSave, restoreSave } from "../controllers/saveExportController.js";

const router = express.Router();

router.use(protect);

router.get("/export", exportSave);
router.post("/restore", restoreSave);

export default router;
