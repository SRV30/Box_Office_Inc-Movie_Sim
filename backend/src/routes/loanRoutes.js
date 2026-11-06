import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { takeLoanSchema, repayLoanSchema } from "../validators/loanValidators.js";
import { takeLoan, getLoans, repayLoanEarly } from "../controllers/loanController.js";

const router = express.Router();

router.get("/", protect, getLoans);
router.post("/take", protect, validate(takeLoanSchema), takeLoan);
router.post("/:loanId/repay", protect, validate(repayLoanSchema), repayLoanEarly);

export default router;
