import {
  listNotificationsService,
  getUnreadCountService,
  markAsReadService,
  markAllAsReadService,
  deleteNotificationService,
  deleteAllNotificationsService,
} from "./notifications.service.js";

export async function listNotifications(req, res) {
  const result = await listNotificationsService(req.user, req.query);
  res.json({ ok: true, data: result });
}

export async function getUnreadCount(req, res) {
  const result = await getUnreadCountService(req.user);
  res.json({ ok: true, data: result });
}

export async function markAsRead(req, res) {
  const result = await markAsReadService(req.user, req.params.id);
  res.json({ ok: true, data: result });
}

export async function markAllAsRead(req, res) {
  const result = await markAllAsReadService(req.user);
  res.json({ ok: true, data: result });
}

export async function deleteNotification(req, res) {
  const result = await deleteNotificationService(req.user, req.params.id);
  res.json({ ok: true, data: result });
}

export async function deleteAllNotifications(req, res) {
  const result = await deleteAllNotificationsService(req.user);
  res.json({ ok: true, data: result });
}
