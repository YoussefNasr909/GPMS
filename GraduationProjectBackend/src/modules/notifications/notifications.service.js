import { AppError } from "../../common/errors/AppError.js";
import {
  listNotificationsByUser,
  countNotificationsByUser,
  countUnreadByUser,
  findNotificationById,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotificationById,
  deleteAllNotificationsByUser,
} from "./notifications.repository.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * GET /notifications
 * Returns paginated notifications for the current user.
 */
export async function listNotificationsService(actor, query) {
  const { page, limit, skip } = parsePagination(query);

  const [notifications, total] = await Promise.all([
    listNotificationsByUser(actor.id, { skip, take: limit }),
    countNotificationsByUser(actor.id),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: skip + limit < total,
    },
  };
}

/**
 * GET /notifications/unread-count
 * Returns only the unread count — used by the topbar bell badge.
 */
export async function getUnreadCountService(actor) {
  const count = await countUnreadByUser(actor.id);
  return { unreadCount: count };
}

/**
 * PATCH /notifications/:id/read
 * Marks a single notification as read.
 */
export async function markAsReadService(actor, notificationId) {
  const notification = await findNotificationById(notificationId);

  if (!notification) {
    throw new AppError("Notification not found.", 404, "NOTIFICATION_NOT_FOUND");
  }

  if (notification.userId !== actor.id) {
    throw new AppError("You are not allowed to access this notification.", 403, "NOTIFICATION_FORBIDDEN");
  }

  if (notification.read) {
    return notification; // already read — nothing to do
  }

  return markNotificationRead(notificationId);
}

/**
 * PATCH /notifications/read-all
 * Marks ALL unread notifications for the current user as read.
 */
export async function markAllAsReadService(actor) {
  await markAllNotificationsRead(actor.id);
  return { ok: true };
}

/**
 * DELETE /notifications/:id
 * Deletes a single notification owned by the current user.
 */
export async function deleteNotificationService(actor, notificationId) {
  const notification = await findNotificationById(notificationId);

  if (!notification) {
    throw new AppError("Notification not found.", 404, "NOTIFICATION_NOT_FOUND");
  }

  if (notification.userId !== actor.id) {
    throw new AppError("You are not allowed to delete this notification.", 403, "NOTIFICATION_FORBIDDEN");
  }

  await deleteNotificationById(notificationId);
  return { ok: true };
}

/**
 * DELETE /notifications
 * Deletes ALL notifications for the current user.
 */
export async function deleteAllNotificationsService(actor) {
  await deleteAllNotificationsByUser(actor.id);
  return { ok: true };
}
