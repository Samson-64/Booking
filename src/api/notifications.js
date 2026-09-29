// Notification feed, unread badge and read tracking.

import { api } from "./client";

export async function fetchNotifications({ unreadOnly = false, limit = 50, offset = 0 } = {}) {
  const { data } = await api.get("/notifications", {
    params: { unread_only: unreadOnly, limit, offset },
  });
  return data;
}

export async function fetchUnreadCount() {
  const { data } = await api.get("/notifications/unread-count");
  return data.count;
}

export async function markNotificationRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.post("/notifications/read-all");
  return data;
}

export async function deleteNotification(id) {
  await api.delete(`/notifications/${id}`);
}
