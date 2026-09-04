import { useEffect, useState, useMemo } from "react";
import { fetchMyBookings } from "../api/booking";
import { apiErrorMessage } from "../api/client";
import Spinner from "../components/Spinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import Badge from "../components/Badge";
import { formatLongDate } from "../utils/format";
import { CalendarDays, CarFront, Clock, MapPin, User } from "lucide-react";

const TABS = [
  { key: "UPCOMING", label: "Upcoming" },
  { key: "PENDING", label: "Pending" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function MyBookings() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("UPCOMING");
  const [filterType, setFilterType] = useState("ALL"); // ALL, APPOINTMENT, PARKING

  useEffect(() => {
    let active = true;
    fetchMyBookings()
      .then((b) => active && setBookings(b))
      .catch((e) => active && setError(apiErrorMessage(e)));
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => {
    const map = { UPCOMING: 0, PENDING: 0, COMPLETED: 0, CANCELLED: 0 };
    if (!bookings) return map;
    for (const b of bookings) {
      if (b.status === "PENDING") map.PENDING++;
      else if (b.status === "CANCELLED") map.CANCELLED++;
      else if (b.category === "UPCOMING") map.UPCOMING++;
      else if (b.category === "COMPLETED") map.COMPLETED++;
    }
    return map;
  }, [bookings]);

  const filtered = useMemo(() => {
    return (bookings || []).filter((b) => {
      // Tab filter
      let matchTab;
      if (tab === "PENDING") matchTab = b.status === "PENDING";
      else if (tab === "CANCELLED") matchTab = b.status === "CANCELLED";
      else matchTab = b.category === tab;

      if (!matchTab) return false;

      // Type filter
      if (filterType !== "ALL" && b.type !== filterType) return false;

      return true;
    });
  }, [bookings, tab, filterType]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              My Bookings & Reservations
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Track and manage your upcoming consultations and reserved parking
            spots.
          </p>
        </div>
      </div>

      {/* Navigation Tabs & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Pill Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1.5">
          {TABS.map((t) => {
            const count = counts[t.key] || 0;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    active
                      ? "bg-teal-50 text-teal-700 border border-teal-200"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter by Type & Search */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white px-2 py-1 shadow-2xs">
            <button
              onClick={() => setFilterType("ALL")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                filterType === "ALL"
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("APPOINTMENT")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                filterType === "APPOINTMENT"
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Appointments
            </button>
            <button
              onClick={() => setFilterType("PARKING")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                filterType === "PARKING"
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Parking
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : bookings === null ? (
        <Spinner label="Loading your reservations…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`No ${tab.toLowerCase()} reservations`}
          message="Book an appointment or reserved parking spot to monitor its status here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((b) => {
            const isAppt = b.type === "APPOINTMENT";
            return (
              <div
                key={b.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar Icon */}
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-2xs ${
                      isAppt ? "bg-teal-600" : "bg-indigo-600"
                    }`}
                  >
                    {isAppt ? (
                      <CalendarDays className="h-6 w-6" />
                    ) : (
                      <CarFront className="h-6 w-6" />
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {isAppt
                          ? `Appointment with ${b.person?.name}`
                          : `Space ${b.space?.name}`}
                      </h3>
                      <Badge color={isAppt ? "blue" : "teal"} size="xs">
                        {isAppt ? "Provider" : "Parking Bay"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                      {isAppt && b.person?.position && (
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {b.person?.position}
                        </span>
                      )}
                      {!isAppt && b.space?.location && (
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {b.space?.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatLongDate(b.date)} · {b.startTime} – {b.endTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right metadata / status */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 sm:mt-0 sm:border-0 sm:pt-0 sm:flex-col sm:items-end sm:gap-2">
                  <StatusBadge status={b.status} />
                  <span className="font-mono text-[11px] font-semibold text-slate-400">
                    Ref: {b.reference}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
