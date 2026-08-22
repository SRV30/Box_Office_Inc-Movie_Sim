import express from "express";
import { holdTestScreening, orderReshoots } from "../controllers/testScreeningController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { testScreeningSchema, orderReshootsSchema } from "../validators/gameplayValidators.js";

const router = express.Router();

router.use(protect);

router.post("/:id/test-screening", validate(testScreeningSchema), holdTestScreening);
router.post("/:id/reshoots", validate(orderReshootsSchema), orderReshoots);

export default router;
