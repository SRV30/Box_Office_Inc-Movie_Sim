import express from "express";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { notificationIdParamSchema } from "../validators/gameplayValidators.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.get("/unread-count", protect, getUnreadNotificationCount);
router.patch("/read-all", protect, markAllNotificationsRead);
router.patch("/:id/read", protect, validate(notificationIdParamSchema), markNotificationRead);
router.delete("/:id", protect, validate(notificationIdParamSchema), deleteNotification);
router.delete("/", protect, deleteAllNotifications);

export default router;
