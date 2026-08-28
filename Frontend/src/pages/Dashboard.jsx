import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchMyBookings } from "../api/booking";
import Card from "../components/Card";
import Spinner from "../components/Spinner";
import ErrorState from "../components/ErrorState";
import { StatusBadge } from "../components/StatusBadge";
import { formatLongDate } from "../utils/format";

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchMyBookings()
      .then((b) => active && setBookings(b))
      .catch(
        (e) =>
          active &&
          setError(e?.response?.data?.error || "Failed to load bookings"),
      );
    return () => {
      active = false;
    };
  }, []);

  const upcoming =
    bookings?.filter(
      (b) =>
        b.category === "UPCOMING" &&
        (b.status === "PENDING" || b.status === "CONFIRMED"),
    ) || [];
  const upcomingAppointments = upcoming.filter(
    (b) => b.type === "APPOINTMENT",
  ).length;
  const upcomingParking = upcoming.filter((b) => b.type === "PARKING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your parking spaces and appointments.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-brand-200">
          <div className="text-sm text-gray-500">Upcoming Appointments</div>
          <div className="mt-1 text-3xl font-bold text-brand-700">
            {upcomingAppointments}
          </div>
          <Link
            to="/appointments"
            className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline"
          >
            Book an appointment →
          </Link>
        </Card>
        <Card className="border-accent-200">
          <div className="text-sm text-gray-500">Upcoming Parking</div>
          <div className="mt-1 text-3xl font-bold text-accent-600">
            {upcomingParking}
          </div>
          <Link
            to="/parking"
            className="mt-3 inline-block text-sm font-semibold text-accent-700 hover:underline"
          >
            Book parking →
          </Link>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Total Active Bookings</div>
          <div className="mt-1 text-3xl font-bold text-gray-800">
            {upcoming.length}
          </div>
          <Link
            to="/my-bookings"
            className="mt-3 inline-block text-sm font-semibold text-gray-700 hover:underline"
          >
            View all →
          </Link>
        </Card>
      </div>

      <Card title="Recent upcoming bookings">
        {error ? (
          <ErrorState message={error} />
        ) : bookings === null ? (
          <Spinner label="Loading bookings…" />
        ) : upcoming.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            No upcoming bookings. Book a parking space or appointment to get
            started.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {upcoming.slice(0, 5).map((b) => (
              <li key={b.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {b.type === "APPOINTMENT"
                      ? `Appointment with ${b.person?.name}`
                      : b.space?.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatLongDate(b.date)} · {b.startTime}–{b.endTime}
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
