import { apiRequest } from "./http"

export type ApiNotification = {
  id: string
  userId: string
  type: string
  title: string
  message: string
  read: boolean
  actionUrl: string | null
  createdAt: string
  updatedAt: string
}

export type ApiNotificationPage = {
  notifications: ApiNotification[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
  }
}

export type ApiUnreadCount = {
  unreadCount: number
}

type ListNotificationsParams = {
  page?: number
  limit?: number
}

function buildNotificationsQuery(params: ListNotificationsParams = {}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set("page", String(params.page))
  if (params.limit) searchParams.set("limit", String(params.limit))
  const query = searchParams.toString()
  return query ? `/notifications?${query}` : "/notifications"
}

export const notificationsApi = {
  /** Paginated list of all notifications for the current user */
  list: (params?: ListNotificationsParams) =>
    apiRequest<ApiNotificationPage>(buildNotificationsQuery(params)),

  /** Unread count only — lightweight, used for the bell badge */
  getUnreadCount: () =>
    apiRequest<ApiUnreadCount>("/notifications/unread-count"),

  /** Mark a single notification as read */
  markRead: (id: string) =>
    apiRequest<ApiNotification>(`/notifications/${id}/read`, { method: "PATCH" }),

  /** Mark all notifications as read */
  markAllRead: () =>
    apiRequest<{ ok: boolean }>("/notifications/read-all", { method: "PATCH" }),

  /** Delete a single notification */
  delete: (id: string) =>
    apiRequest<{ ok: boolean }>(`/notifications/${id}`, { method: "DELETE" }),

  /** Delete all notifications */
  deleteAll: () =>
    apiRequest<{ ok: boolean }>("/notifications", { method: "DELETE" }),
}
