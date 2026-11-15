import jwt from "jsonwebtoken";
import env from "../config/envConfig.js";
import User from "../models/User.js";
import {
  AUTH_EVENTS,
  recordAuthEvent,
} from "../services/auth/authMonitoringService.js";

const authError = (res, status, code, message, req) =>
  res.status(status).json({
    success: false,
    code,
    message,
    requestId: req.requestId,
  });

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      await recordAuthEvent(req, {
        eventType: AUTH_EVENTS.AUTH_FAILURE,
        reason: "ACCESS_TOKEN_MISSING",
      });

      return res.status(401).json({
        success: false,
        code: "ACCESS_TOKEN_MISSING",
        message: "Authentication required. Please log in.",
      });
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.userId).select(
      "-password -refreshTokens",
    );

    if (!user) {
      await recordAuthEvent(req, {
        user: decoded.userId,
        eventType: AUTH_EVENTS.AUTH_FAILURE,
        reason: "ACCESS_USER_NOT_FOUND",
      });

      return authError(res, 401, "ACCESS_USER_NOT_FOUND", "User account not found.", req);
    }

    if (user.isDisabled) {
      await recordAuthEvent(req, {
        user: user._id,
        eventType: AUTH_EVENTS.SESSION_EXPIRED,
        reason: "ACCOUNT_DISABLED",
      });

      return authError(res, 403, "ACCOUNT_DISABLED", "This account has been disabled.", req);
    }

    req.user = user;

    next();
  } catch (error) {
    await recordAuthEvent(req, {
      eventType:
        error.name === "TokenExpiredError"
          ? AUTH_EVENTS.SESSION_EXPIRED
          : AUTH_EVENTS.AUTH_FAILURE,
      reason: error.name || "ACCESS_TOKEN_INVALID",
    });

    const isExpired = error.name === "TokenExpiredError";
    return authError(
      res,
      401,
      isExpired ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
      isExpired ? "Your session has expired. Please log in again." : "Invalid or malformed authentication token.",
      req,
    );
  }
};

/**
 * Authorization guard for admin / operations roles or internal service calls
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Authentication required.",
        requestId: req.requestId,
      });
    }

    const userRole = req.user.role || "player";
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "You do not have permission to access this resource.",
        requestId: req.requestId,
      });
    }

    next();
  };
};
