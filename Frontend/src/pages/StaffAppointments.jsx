import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  fetchAllAppointments,
  updateAppointmentStatus,
} from "../api/booking";
import { apiErrorMessage } from "../api/client";
import Card from "../components/Card";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { formatLongDate } from "../utils/format";
import { CalendarDays } from "lucide-react";

const TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function StaffAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("PENDING");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    fetchAllAppointments()
      .then((a) => active && setAppointments(a))
      .catch((e) => active && setError(apiErrorMessage(e)));
    return () => {
      active = false;
    };
  }, []);

  if (user?.role !== "STAFF") {
    return <Navigate to="/" replace />;
  }

  async function handleStatus(appt, status) {
    setBusyId(appt.id);
    setError("");
    try {
      await updateAppointmentStatus(appt.id, status);
      setAppointments((prev) =>
        (prev || []).map((a) => (a.id === appt.id ? { ...a, status } : a)),
      );
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  const filtered = (appointments || []).filter((a) => a.status === tab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Manage Appointments
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Review appointment requests and update their status.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1 sm:w-max">
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

      {error && <ErrorState message={error} />}

      {appointments === null ? (
        <Spinner label="Loading appointments…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`No ${tab.toLowerCase()} appointments`}
          message="Appointment requests will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((appt) => (
            <Card key={appt.id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-lg">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      {appt.person?.name} · {appt.person?.position}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {appt.user?.name} ({appt.user?.email}) ·{" "}
                      {formatLongDate(appt.date)} · {appt.startTime}–
                      {appt.endTime}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={appt.status} />
                  {appt.status === "PENDING" && (
                    <Button
                      variant="success"
                      size="sm"
                      loading={busyId === appt.id}
                      onClick={() => handleStatus(appt, "CONFIRMED")}
                    >
                      Accept
                    </Button>
                  )}
                  {appt.status === "CONFIRMED" && (
                    <Button
                      variant="primary"
                      loading={busyId === appt.id}
                      onClick={() => handleStatus(appt, "COMPLETED")}
                    >
                      Complete
                    </Button>
                  )}
                  {(appt.status === "PENDING" ||
                    appt.status === "CONFIRMED") && (
                    <Button
                      variant="danger"
                      loading={busyId === appt.id}
                      onClick={() => handleStatus(appt, "CANCELLED")}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
