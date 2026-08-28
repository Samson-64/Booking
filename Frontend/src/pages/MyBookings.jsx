import { useEffect, useState } from "react";
import { fetchMyBookings } from "../api/booking";
import { apiErrorMessage } from "../api/client";
import Spinner from "../components/Spinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import Badge from "../components/Badge";
import { formatLongDate } from "../utils/format";
import { CalendarDays, CarFront } from "lucide-react";

const TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "UPCOMING", label: "Upcoming" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function MyBookings() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("UPCOMING");

  useEffect(() => {
    let active = true;
    fetchMyBookings()
      .then((b) => active && setBookings(b))
      .catch((e) => active && setError(apiErrorMessage(e)));
    return () => {
      active = false;
    };
  }, []);

  const filtered = (bookings || []).filter((b) => {
    if (tab === "PENDING") return b.status === "PENDING";
    if (tab === "CANCELLED") return b.status === "CANCELLED";
    return b.category === tab;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your parking spaces and appointments.
        </p>
      </div>

      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 sm:w-max">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-brand-700 shadow-sm"
                : "text-gray-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : bookings === null ? (
        <Spinner label="Loading your bookings…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`No ${tab.toLowerCase()} bookings`}
          message="Book a parking space or appointment to see it here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${
                      b.type === "PARKING" ? "bg-teal-100" : "bg-brand-100"
                    }`}
                  >
                    {b.type === "PARKING" ? <CarFront className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      {b.type === "APPOINTMENT"
                        ? `with ${b.person?.name}`
                        : b.space?.name}
                      <Badge color={b.type === "APPOINTMENT" ? "blue" : "teal"}>
                        {b.type === "APPOINTMENT" ? "Appointment" : "Parking"}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {b.type === "APPOINTMENT" && (
                        <span>{b.person?.position} · </span>
                      )}
                      {formatLongDate(b.date)} · {b.startTime}–{b.endTime}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={b.status} />
                  <span className="text-xs text-gray-400">{b.reference}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
