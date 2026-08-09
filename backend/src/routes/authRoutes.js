import express from "express";

import {
  register,
  login,
  refreshSession,
  logout,
  getMe,
  getAuthDiagnostics,
  googleAuth
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { registerSchema, loginSchema } from "../validators/authValidators.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// FIXED: Wrapped the schemas in an object with a 'body' property so the middleware catches them!
router.post("/register", authRateLimiter, validate({ body: registerSchema }), register);

router.post("/login", authRateLimiter, validate({ body: loginSchema }), login);

router.post("/refresh", refreshSession);

router.post("/logout", logout);

router.get("/diagnostics", protect, getAuthDiagnostics);

router.get("/me", protect, getMe);

router.post('/google', authRateLimiter, googleAuth);

export default router;
