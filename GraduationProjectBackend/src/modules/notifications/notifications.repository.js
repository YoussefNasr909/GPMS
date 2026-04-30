import { prisma } from "../../loaders/dbLoader.js";

const NOTIFICATION_SELECT = {
  id: true,
  userId: true,
  type: true,
  title: true,
  message: true,
  read: true,
  actionUrl: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * List all notifications for a user, newest first, with optional pagination.
 */
export function listNotificationsByUser(userId, { skip = 0, take = 20 } = {}, tx = prisma) {
  return tx.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip,
    take,
    select: NOTIFICATION_SELECT,
  });
}

/**
 * Count total notifications for a user (for pagination).
 */
export function countNotificationsByUser(userId, tx = prisma) {
  return tx.notification.count({ where: { userId } });
}

/**
 * Count only unread notifications for a user (used by the topbar badge).
 */
export function countUnreadByUser(userId, tx = prisma) {
  return tx.notification.count({ where: { userId, read: false } });
}

/**
 * Find a single notification by id.
 */
export function findNotificationById(id, tx = prisma) {
  return tx.notification.findUnique({ where: { id }, select: NOTIFICATION_SELECT });
}

/**
 * Mark a single notification as read.
 */
export function markNotificationRead(id, tx = prisma) {
  return tx.notification.update({
    where: { id },
    data: { read: true },
    select: NOTIFICATION_SELECT,
  });
}

/**
 * Mark all unread notifications for a user as read.
 */
export function markAllNotificationsRead(userId, tx = prisma) {
  return tx.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

/**
 * Delete a single notification.
 */
export function deleteNotificationById(id, tx = prisma) {
  return tx.notification.delete({ where: { id } });
}

/**
 * Delete all notifications for a user.
 */
export function deleteAllNotificationsByUser(userId, tx = prisma) {
  return tx.notification.deleteMany({ where: { userId } });
}
