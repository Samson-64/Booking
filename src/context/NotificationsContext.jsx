import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiErrorMessage } from "../api/client";
import {
  deleteNotification as removeNotification,
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead as saveAllRead,
  markNotificationRead,
} from "../api/notifications";
import { useWebSocket } from "../hooks/useWebSocket";

const NotificationsContext = createContext(null);

// Owns the notification feed and the unread badge. The badge is kept warm by
// the /api/ws push so it increments the moment a booking changes, rather than
// waiting for the next poll or page visit.
//
// Mounted only for a signed-in user (see ProtectedRoute).
export function NotificationsProvider({ children }) {
  // null means "not loaded yet" and drives `loading`, so there is no separate
  // loading flag to set from inside the fetch effect.
  const [items, setItems] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);

  // Promise callbacks keep the setState calls off the effect's synchronous
  // path, and the returned promise lets callers await a reload.
  const refresh = useCallback(
    () =>
      fetchNotifications()
        .then((data) => {
          setError(null);
          setItems(data.items);
          setUnreadCount(data.unreadCount);
        })
        .catch((err) => {
          setError(apiErrorMessage(err));
          // A failed first load must not leave the feed stuck on "loading".
          setItems((prev) => prev ?? []);
        }),
    [],
  );

  const refreshUnreadCount = useCallback(
    () =>
      fetchUnreadCount()
        .then(setUnreadCount)
        .catch(() => {
          // A badge that is briefly stale is not worth surfacing an error for.
        }),
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useWebSocket((frame) => {
    if (frame?.type === "notification") {
      // The push is a signal, not a payload to trust, so refetch the list.
      refresh();
    } else if (frame?.type === "booking_changed") {
      // A status change usually produces a notification right after.
      refreshUnreadCount();
    }
  });

  const markRead = useCallback(async (id) => {
    // Optimistic: the badge is the thing the user is looking at. Only decrement
    // when the item was actually unread, or a repeat tap would under-count.
    let wasUnread = false;
    setItems((prev) =>
      (prev ?? []).map((n) => {
        if (n.id !== id || n.read) return n;
        wasUnread = true;
        return { ...n, read: true };
      }),
    );
    if (wasUnread) setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await markNotificationRead(id);
    } catch (err) {
      setError(apiErrorMessage(err));
      refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    const previous = items;
    setItems((prev) => (prev ?? []).map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await saveAllRead();
    } catch (err) {
      setError(apiErrorMessage(err));
      setItems(previous);
      refresh();
    }
  }, [items, refresh]);

  const remove = useCallback(
    async (id) => {
      const previous = items;
      setItems((prev) => (prev ?? []).filter((n) => n.id !== id));
      try {
        await removeNotification(id);
        refreshUnreadCount();
      } catch (err) {
        setError(apiErrorMessage(err));
        setItems(previous);
      }
    },
    [items, refreshUnreadCount],
  );

  const value = useMemo(
    () => ({
      items: items ?? [],
      unreadCount,
      loading: items === null && error === null,
      error,
      reload: refresh,
      markRead,
      markAllRead,
      remove,
    }),
    [items, unreadCount, error, refresh, markRead, markAllRead, remove],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

// Context files legitimately export hooks/utilities alongside the provider.
/* eslint-disable react-refresh/only-export-components */
export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used inside NotificationsProvider");
  }
  return ctx;
}
/* eslint-enable react-refresh/only-export-components */
