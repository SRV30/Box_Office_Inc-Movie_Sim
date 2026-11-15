import express from "express";
import mongoose from "mongoose";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * GET /api/observability/metrics
 * Protected operations telemetry endpoint:
 * Requires authentication and 'admin' or 'operations' role.
 * Sanitized to avoid exposing internal infrastructure details (e.g. host paths, raw PIDs, internal network topologies).
 */
router.get("/metrics", protect, requireRole("admin", "operations"), (req, res) => {
  const mem = process.memoryUsage();
  const uptimeSeconds = Math.round(process.uptime());

  const dbConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    service: {
      status: "healthy",
      uptimeSeconds,
    },
    memory: {
      heapUsedMB: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMB: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
      rssMB: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
    },
    database: {
      connected: dbConnected,
    },
    requestId: req.requestId,
  });
});

export default router;
