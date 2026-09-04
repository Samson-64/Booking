import { useEffect, useState, useMemo } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  fetchMySpecialistAppointments,
  updateSpecialistAppointmentStatus,
} from "../api/booking";
import { apiErrorMessage } from "../api/client";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import Badge from "../components/Badge";
import Card from "../components/Card";
import { formatLongDate } from "../utils/format";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Users,
  CalendarDays,
  Car,
  Plus,
  ClipboardList,
} from "lucide-react";

const TABS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function SpecialistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("ALL");
  const [busyId, setBusyId] = useState(null);

  const isSpecialist = user?.role === "SPECIALIST";

  useEffect(() => {
    if (!isSpecialist) return;
    let active = true;
    fetchMySpecialistAppointments()
      .then((a) => active && setAppointments(a))
      .catch((e) => active && setError(apiErrorMessage(e)));
    return () => {
      active = false;
    };
  }, [isSpecialist]);

  const counts = useMemo(() => {
    const map = {
      ALL: 0,
      PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    if (!appointments) return map;
    for (const a of appointments) {
      map[a.status] = (map[a.status] || 0) + 1;
      map.ALL++;
    }
    return map;
  }, [appointments]);

  if (!isSpecialist) {
    return <Navigate to="/" replace />;
  }

  async function handleStatus(appt, status) {
    setBusyId(appt.id);
    setError("");
    try {
      await updateSpecialistAppointmentStatus(appt.id, status);
      setAppointments((prev) =>
        (prev || []).map((a) => (a.id === appt.id ? { ...a, status } : a)),
      );
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = counts.PENDING || 0;
  const upcomingCount = (appointments || []).filter(
    (a) => a.status === "CONFIRMED" && a.category === "UPCOMING",
  ).length;

  const filtered = (appointments || []).filter(
    (a) => tab === "ALL" || a.status === tab,
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Provider Dashboard
            </h1>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
              Provider
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Welcome back, {user?.name}. Review the appointments assigned to you,
            verify them, and update their status.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/parking")}
            icon={<Car className="h-4 w-4 text-teal-600" />}
          >
            Reserve Parking
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={() => navigate("/appointments")}
            icon={<Plus className="h-4 w-4" />}
          >
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card noPadding>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Review
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ClipboardList className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {pendingCount}
            </div>
          </div>
        </Card>
        <Card noPadding>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Upcoming Confirmed
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {upcomingCount}
            </div>
          </div>
        </Card>
        <Card noPadding>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Assigned
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {counts.ALL || 0}
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
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

      {error && <ErrorState message={error} />}

      {appointments === null ? (
        <Spinner label="Loading your appointments…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            tab === "ALL"
              ? "No appointments assigned yet"
              : `No ${tab.toLowerCase()} appointments`
          }
          message={
            tab === "ALL"
              ? "When a client books an appointment with you, it will appear here for you to review and update."
              : "No appointment records currently match this status filter."
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((appt) => (
            <div
              key={appt.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Left info */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {appt.person?.name}
                      </h3>
                      <Badge color="blue" size="xs">
                        {appt.person?.position || "Provider"}
                      </Badge>
                      <StatusBadge status={appt.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        Client: {appt.user?.name}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {appt.user?.email}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatLongDate(appt.date)} · {appt.startTime} –{" "}
                        {appt.endTime}
                      </span>
                      <span className="font-mono text-slate-400">
                        {appt.reference}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 border-t border-slate-100 pt-3 lg:border-0 lg:pt-0">
                  {appt.status === "PENDING" && (
                    <Button
                      variant="success"
                      size="sm"
                      loading={busyId === appt.id}
                      onClick={() => handleStatus(appt, "CONFIRMED")}
                      className="gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verify & Confirm
                    </Button>
                  )}
                  {appt.status === "CONFIRMED" && (
                    <Button
                      variant="gradient"
                      size="sm"
                      loading={busyId === appt.id}
                      onClick={() => handleStatus(appt, "COMPLETED")}
                      className="gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark Completed
                    </Button>
                  )}
                  {(appt.status === "PENDING" ||
                    appt.status === "CONFIRMED") && (
                    <Button
                      variant="danger"
                      size="sm"
                      loading={busyId === appt.id}
                      onClick={() => handleStatus(appt, "CANCELLED")}
                      className="gap-1.5"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Also book your own slots
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            As a provider you can also schedule appointments and reserve parking
            like a client.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/appointments"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Book Appointment
          </Link>
          <Link
            to="/parking"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Reserve Parking
          </Link>
        </div>
      </div>
    </div>
  );
}
