import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, CalendarClock, CheckCheck, Info, Sparkles, X } from "lucide-react";
import { useNotifications } from "../context/NotificationsContext";
import { formatRelative } from "../utils/relativeTime";

// Per-category icon + tint, so the list is scannable.
const CATEGORY_STYLE = {
  BOOKING_STATUS: { icon: CalendarClock, className: "text-accent-600 bg-accent-50" },
  NEW_BOOKING: { icon: Sparkles, className: "text-emerald-600 bg-emerald-50" },
  REMINDER: { icon: Bell, className: "text-amber-600 bg-amber-50" },
  SYSTEM: { icon: Info, className: "text-slate-600 bg-slate-100" },
};

// Sidebar-style button with a live unread badge and a preview dropdown.
// The same component serves the desktop sidebar and the mobile drawer.
export default function NotificationBell({ className = "" }) {
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  // Remembers the route the menu was last opened on, so a navigation closes it
  // without needing an effect.
  const [openedAt, setOpenedAt] = useState(location.pathname);
  const containerRef = useRef(null);

  // Never leave the dropdown open across a navigation.
  if (openedAt !== location.pathname) {
    setOpenedAt(location.pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const preview = items.slice(0, 5);

  function viewAll() {
    setOpen(false);
    navigate("/notifications");
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
        }
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
      >
        <span className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-600 px-1 text-[9px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </span>
        <span>Notifications</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-xs font-bold text-slate-900">Notifications</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-[10px] font-semibold text-accent-600 hover:text-accent-700 cursor-pointer"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            ) : (
              <span className="text-[10px] font-medium text-slate-400">
                All caught up
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">
                Loading…
              </p>
            ) : preview.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                <p className="text-xs font-semibold text-slate-700">
                  No notifications yet
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Booking updates will show up here.
                </p>
              </div>
            ) : (
              preview.map((item) => {
                const style = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.SYSTEM;
                const Icon = style.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      markRead(item.id);
                      if (item.bookingId) {
                        setOpen(false);
                        navigate("/my-bookings");
                      }
                    }}
                    className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 cursor-pointer ${
                      item.read ? "opacity-60" : "bg-accent-50/30"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.className}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className="truncate text-xs font-semibold text-slate-900">
                          {item.title}
                        </span>
                        <span className="ml-auto shrink-0 text-[10px] text-slate-400">
                          {formatRelative(item.createdAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-600">
                        {item.body}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={viewAll}
            className="w-full border-t border-slate-100 px-4 py-2.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}

// Small header badge used on the Notifications page title.
export function UnreadPill({ count, onClear, className = "" }) {
  if (!count) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-[10px] font-bold text-accent-700 ${className}`}
    >
      {count} unread
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Mark all as read"
          className="rounded-full p-0.5 hover:bg-accent-100 cursor-pointer"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
