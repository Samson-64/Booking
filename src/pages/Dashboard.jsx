import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchMyBookings } from "../api/booking";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import Badge from "../components/Badge";
import {
  formatLongDate,
  formatShortDate,
  todayLocalStr,
} from "../utils/format";
import {
  CarFront,
  Clock,
  RotateCcw,
  Plus,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  Calendar,
  X,
  ChevronRight,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const searchFilter = outletContext?.searchQuery || "";

  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, APPOINTMENT, PARKING, CALENDAR
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  useEffect(() => {
    let active = true;
    fetchMyBookings()
      .then((b) => active && setBookings(b))
      .catch((e) => {
        if (active)
          setError(e?.response?.data?.error || "Failed to load bookings");
      });
    return () => {
      active = false;
    };
  }, []);

  // Compute metrics
  const upcoming = useMemo(() => {
    return (
      bookings?.filter(
        (b) =>
          b.category === "UPCOMING" &&
          (b.status === "PENDING" || b.status === "CONFIRMED"),
      ) || []
    );
  }, [bookings]);

  const todayStr = todayLocalStr();
  const todayBookings = useMemo(() => {
    return (bookings || []).filter((b) => b.date === todayStr);
  }, [bookings, todayStr]);

  const upcomingAppointments = upcoming.filter(
    (b) => b.type === "APPOINTMENT",
  ).length;
  const upcomingParking = upcoming.filter((b) => b.type === "PARKING").length;
  const confirmedCount = (bookings || []).filter(
    (b) => b.status === "CONFIRMED",
  ).length;

  // Filtered list based on active tab, date, and search
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((b) => {
      // Type tab
      if (activeTab === "APPOINTMENT" && b.type !== "APPOINTMENT") return false;
      if (activeTab === "PARKING" && b.type !== "PARKING") return false;

      // Date filter if selected from calendar
      if (selectedDateFilter && b.date !== selectedDateFilter) return false;

      // Search query
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const name = (b.person?.name || b.space?.name || "").toLowerCase();
        const ref = (b.reference || "").toLowerCase();
        const pos = (
          b.person?.position ||
          b.space?.location ||
          ""
        ).toLowerCase();
        if (!name.includes(q) && !ref.includes(q) && !pos.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, activeTab, selectedDateFilter, searchFilter]);

  function handleResetFilters() {
    setActiveTab("ALL");
    setSelectedDateFilter(null);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ================= GREETING & HEADER ================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className=" sm:text-2xl font-bold tracking-tight text-gray-900">
              {greeting}, <span className="text-gray-500">{user?.name}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/parking")}
            icon={<CarFront className="h-4 w-4 text-slate-900" />}
            className="border-none"
          >
            Find Parking
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={() => navigate("/appointments")}
            icon={<Plus className="h-4 w-4" />}
            className="bg-slate-900 border-none"
          >
            Book Appointment
          </Button>
        </div>
      </div>

      {/* ================= METRIC STAT CARDS ROW ================= */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Card 1: Dark hero card */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900 p-3.5 text-white shadow-md border-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-300 truncate">
              Today's
            </span>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal-300">
              <Calendar className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight">
              {todayBookings.length}
            </span>
            <span className="text-[10px] text-teal-200">
              {todayBookings.length === 1 ? "slot" : "slots"}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-slate-300">
            <span>{upcoming.length} upcoming</span>
            <Link
              to="/my-bookings"
              className="font-semibold text-teal-300 hover:text-teal-200 flex items-center gap-0.5"
            >
              View <ChevronRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: Appointments */}
        <div className="rounded-xl border-none bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Appointments
            </span>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <UserCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {upcomingAppointments}
            </span>
            <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="h-2.5 w-2.5" /> Active
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
            <span className="text-slate-400">Scheduled</span>
            <Link
              to="/appointments"
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Book →
            </Link>
          </div>
        </div>

        {/* Card 3: Parking Spaces */}
        <div className="rounded-xl border-none bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Parking
            </span>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <CarFront className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {upcomingParking}
            </span>
            <span className="text-[10px] font-medium text-teal-600">
              Reserved
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
            <span className="text-slate-400">Multi-floor</span>
            <Link
              to="/parking"
              className="font-semibold text-teal-600 hover:text-teal-700"
            >
              Browse →
            </Link>
          </div>
        </div>

        {/* Card 4: Confirmed Rate */}
        <div className="rounded-xl border-none bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Confirmed
            </span>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {confirmedCount}
            </span>
            <span className="text-[10px] font-medium text-slate-500">
              total
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
            <span className="text-slate-400">All-time</span>
            <Link
              to="/my-bookings"
              className="font-semibold text-slate-700 hover:text-slate-900"
            >
              History →
            </Link>
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT SECTION ================= */}
      <div className="space-y-4">
        {/* Navigation Tabs & Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl  bg-white p-3 shadow-2xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: "ALL", label: "All Bookings" },
              { key: "APPOINTMENT", label: "Appointments" },
              { key: "PARKING", label: "Parking Spaces" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2">
            {/* Reset Button */}
            {(activeTab !== "ALL" || selectedDateFilter) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Data Grid or List */}
        {error ? (
          <ErrorState message={error} />
        ) : bookings === null ? (
          <Spinner label="Loading bookings and schedules…" />
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            title="No bookings match your current criteria"
            message={
              searchFilter
                ? `No results found for "${searchFilter}". Try adjusting your search.`
                : "Get started by reserving a parking space or scheduling an appointment."
            }
            action={
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate("/parking")}
                >
                  Book Parking
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => navigate("/appointments")}
                >
                  New Appointment
                </Button>
              </div>
            }
          />
        ) : (
          /* ================= COMPACT CARD GRID ================= */
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBookings.map((b) => {
              const isAppt = b.type === "APPOINTMENT";
              const titleName = isAppt ? b.person?.name : b.space?.name;
              const subDetail = isAppt
                ? b.person?.position
                : b.space?.location || "Parking Facility";
              const initial = (titleName || "B").charAt(0);

              return (
                <div
                  key={b.id}
                  className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div>
                    {/* Top Header with Avatar, Name, and Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-2xs ${
                            isAppt ? "bg-indigo-600" : "bg-slate-900"
                          }`}
                        >
                          {initial}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-tight">
                            {titleName}
                          </h4>
                          <p className="text-[11px] text-slate-500 leading-tight">
                            {subDetail}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={b.status} size="sm" />
                    </div>

                    {/* Time Slot & Date Badge */}
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 border border-slate-100">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="h-3.5 w-3.5 text-teal-600" />
                        <span>
                          {b.startTime} – {b.endTime}
                        </span>
                      </div>
                      <Badge color={isAppt ? "indigo" : "teal"} size="sm">
                        {formatShortDate(b.date)}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="flex-1 rounded-lg bg-slate-900 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() =>
                        navigate(isAppt ? "/appointments" : "/parking")
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Book another"
                    >
                      Book Again
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= DETAILS MODAL ================= */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Booking Summary
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedBooking.type === "APPOINTMENT"
                    ? selectedBooking.person?.name
                    : selectedBooking.space?.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 py-2">
                <span className="text-slate-500">Category</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {selectedBooking.type?.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-2">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={selectedBooking.status} size="sm" />
              </div>
              <div className="flex justify-between border-b border-slate-100 py-2">
                <span className="text-slate-500">Date</span>
                <span className="font-semibold text-slate-900">
                  {formatLongDate(selectedBooking.date)}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-2">
                <span className="text-slate-500">Time Window</span>
                <span className="font-semibold text-slate-900">
                  {selectedBooking.startTime} – {selectedBooking.endTime}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-2">
                <span className="text-slate-500">Reference ID</span>
                <span className="font-mono text-xs font-bold text-slate-700">
                  {selectedBooking.reference}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </Button>
              <Button
                // variant="primary"
                size="sm"
                className="bg-slate-900"
                onClick={() => {
                  setSelectedBooking(null);
                  navigate("/my-bookings");
                }}
              >
                Manage in My Bookings
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
