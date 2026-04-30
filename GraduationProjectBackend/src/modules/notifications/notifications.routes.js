import { Router } from "express";
import { auth } from "../../middlewares/auth.middleware.js";
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "./notifications.controller.js";

const router = Router();

// All notification routes require authentication
router.use(auth);

// GET  /api/v1/notifications              — list all (paginated)
router.get("/", listNotifications);

// GET  /api/v1/notifications/unread-count — unread badge count
router.get("/unread-count", getUnreadCount);

// PATCH /api/v1/notifications/read-all    — mark all as read
router.patch("/read-all", markAllAsRead);

// PATCH /api/v1/notifications/:id/read    — mark one as read
router.patch("/:id/read", markAsRead);

// DELETE /api/v1/notifications            — delete all
router.delete("/", deleteAllNotifications);

// DELETE /api/v1/notifications/:id        — delete one
router.delete("/:id", deleteNotification);

export default router;
