import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarClock, CheckCheck, Sparkles, Info, Trash2 } from "lucide-react";
import { useNotifications } from "../context/NotificationsContext";
import { useSettings } from "../context/SettingsContext";
import { formatRelative } from "../utils/relativeTime";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import Spinner from "../components/Spinner";

const CATEGORY = {
  BOOKING_STATUS: {
    icon: CalendarClock,
    className: "text-accent-600 bg-accent-50",
    label: "Booking update",
  },
  NEW_BOOKING: {
    icon: Sparkles,
    className: "text-emerald-600 bg-emerald-50",
    label: "New booking",
  },
  REMINDER: { icon: Bell, className: "text-amber-600 bg-amber-50", label: "Reminder" },
  SYSTEM: { icon: Info, className: "text-slate-600 bg-slate-100", label: "System" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
];

export default function Notifications() {
  const { items, unreadCount, loading, error, reload, markRead, markAllRead, remove } =
    useNotifications();
  const { reload: reloadSettings } = useSettings();
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const visible = filter === "unread" ? items.filter((n) => !n.read) : items;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Spinner label="Loading notifications" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-in fade-in duration-200">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "You're all caught up."}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="secondary"
            icon={<CheckCheck className="h-4 w-4" />}
            onClick={markAllRead}
          >
            Mark all read
          </Button>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1.5">
          {FILTERS.map((f) => {
            const count =
              f.key === "unread" ? unreadCount : items.length;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  filter === f.key
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f.label}
                <span className="ml-1.5 text-[10px] text-slate-400">{count}</span>
              </button>
            );
          })}
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            reload();
            reloadSettings();
          }}
        >
          Refresh
        </Button>

        <Button size="sm" variant="ghost" onClick={() => navigate("/settings")}>
          Notification preferences
        </Button>
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}

      {!error && visible.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8 text-slate-400" />}
          title={
            filter === "unread" ? "No unread notifications" : "No notifications yet"
          }
          message={
            filter === "unread"
              ? "Everything here has been read."
              : "When a booking is confirmed, changed or about to start, it will show up here."
          }
          action={
            filter === "unread" ? (
              <Button size="sm" variant="secondary" onClick={() => setFilter("all")}>
                Show all
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => navigate("/appointments")}>
                Book an appointment
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-2">
          {visible.map((item) => {
            const style = CATEGORY[item.category] ?? CATEGORY.SYSTEM;
            const Icon = style.icon;
            return (
              <li
                key={item.id}
                className={`flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-opacity ${
                  item.read ? "opacity-65" : ""
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.className}`}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </span>
                    {!item.read && (
                      <span className="rounded-full bg-accent-50 px-1.5 py-0.5 text-[9px] font-semibold text-accent-700">
                        New
                      </span>
                    )}
                    <span className="ml-auto shrink-0 text-[10px] text-slate-400">
                      {formatRelative(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {item.body}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-medium text-slate-400">
                      {style.label}
                    </span>
                    {!item.read && (
                      <button
                        type="button"
                        onClick={() => markRead(item.id)}
                        className="text-[11px] font-semibold text-accent-600 hover:text-accent-700 cursor-pointer"
                      >
                        Mark as read
                      </button>
                    )}
                    {item.bookingId && (
                      <button
                        type="button"
                        onClick={() => navigate("/my-bookings")}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        View booking
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`Delete notification: ${item.title}`}
                      className="ml-auto rounded-lg p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
