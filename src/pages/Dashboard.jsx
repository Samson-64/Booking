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
import { formatLongDate, formatShortDate, todayLocalStr } from "../utils/format";
import {
  CarFront,
  Clock,
  LayoutGrid,
  List as ListIcon,
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
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
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
        if (active) setError(e?.response?.data?.error || "Failed to load bookings");
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

  const upcomingAppointments = upcoming.filter((b) => b.type === "APPOINTMENT").length;
  const upcomingParking = upcoming.filter((b) => b.type === "PARKING").length;
  const confirmedCount = (bookings || []).filter((b) => b.status === "CONFIRMED").length;

  // Filtered list based on active tab, status filter, date, and search
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((b) => {
      // Type tab
      if (activeTab === "APPOINTMENT" && b.type !== "APPOINTMENT") return false;
      if (activeTab === "PARKING" && b.type !== "PARKING") return false;

      // Status filter
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;

      // Date filter if selected from calendar
      if (selectedDateFilter && b.date !== selectedDateFilter) return false;

      // Search query
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const name = (b.person?.name || b.space?.name || "").toLowerCase();
        const ref = (b.reference || "").toLowerCase();
        const pos = (b.person?.position || b.space?.location || "").toLowerCase();
        if (!name.includes(q) && !ref.includes(q) && !pos.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, activeTab, statusFilter, selectedDateFilter, searchFilter]);

  function handleResetFilters() {
    setActiveTab("ALL");
    setStatusFilter("ALL");
    setSelectedDateFilter(null);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ================= GREETING & HEADER ================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {greeting}, <span className="text-teal-700">{user?.name}</span>
            </h1>
            <span className="hidden sm:inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 border border-teal-200/60">
              {user?.role === "STAFF" ? "Staff Manager" : "Verified Client"}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Here is your live overview of active appointments and reserved parking slots.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/parking")}
            icon={<CarFront className="h-4 w-4 text-teal-600" />}
          >
            Find Parking
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

      {/* ================= METRIC STAT CARDS ROW ================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Dark hero card (like inspiration 1) */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 text-white shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-300">
              Today's Schedule
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md text-teal-300">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">
              {todayBookings.length}
            </span>
            <span className="text-xs text-teal-200">
              {todayBookings.length === 1 ? "Slot today" : "Slots today"}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-slate-300">
            <span>{upcoming.length} active upcoming</span>
            <Link
              to="/my-bookings"
              className="font-semibold text-teal-300 hover:text-teal-200 flex items-center gap-1"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Appointments */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-teal-300 hover:shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Appointments
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {upcomingAppointments}
            </span>
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> Active
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-400">Scheduled sessions</span>
            <Link
              to="/appointments"
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Book new →
            </Link>
          </div>
        </div>

        {/* Card 3: Parking Spaces */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-teal-300 hover:shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Parking Reserved
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <CarFront className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {upcomingParking}
            </span>
            <span className="text-xs font-medium text-teal-600">
              Slots booked
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-400">Multi-floor access</span>
            <Link
              to="/parking"
              className="font-semibold text-teal-600 hover:text-teal-700"
            >
              Browse floors →
            </Link>
          </div>
        </div>

        {/* Card 4: Confirmed Rate */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-teal-300 hover:shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Confirmed Total
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {confirmedCount}
            </span>
            <span className="text-xs font-medium text-slate-500">
              verified
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-400">All-time record</span>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs">
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
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-teal-700 shadow-2xs"
                    : "text-slate-400 hover:text-slate-700"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white text-teal-700 shadow-2xs"
                    : "text-slate-400 hover:text-slate-700"
                }`}
                title="List View"
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Reset Button */}
            {(activeTab !== "ALL" || statusFilter !== "ALL" || selectedDateFilter) && (
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
        ) : viewMode === "grid" ? (
          /* ================= INSPIRATION CARD GRID ================= */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
                >
                  <div>
                    {/* Top Header with Avatar, Name, and Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-2xs ${
                            isAppt ? "bg-indigo-600" : "bg-teal-600"
                          }`}
                        >
                          {initial}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                            {titleName}
                          </h4>
                          <p className="text-xs text-slate-500">{subDetail}</p>
                          <span className="mt-0.5 inline-block text-[10px] font-mono text-slate-400">
                            {b.reference}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={b.status} size="sm" />
                    </div>

                    {/* Time Slot & Date Badge */}
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 border border-slate-100">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="h-3.5 w-3.5 text-teal-600" />
                        <span>
                          {b.startTime} – {b.endTime}
                        </span>
                      </div>
                      <Badge
                        color={isAppt ? "indigo" : "teal"}
                        size="sm"
                      >
                        {formatShortDate(b.date)}
                      </Badge>
                    </div>
                  </div>

                  {/* Dual Action Buttons (like Inspiration 1: Session / History) */}
                  <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="flex-1 rounded-xl bg-teal-600 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-teal-500 transition-all cursor-pointer"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() =>
                        navigate(isAppt ? "/appointments" : "/parking")
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Book another"
                    >
                      Book Again
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= LIST VIEW ================= */
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
            <div className="divide-y divide-slate-100">
              {filteredBookings.map((b) => {
                const isAppt = b.type === "APPOINTMENT";
                const titleName = isAppt ? b.person?.name : b.space?.name;
                const subDetail = isAppt
                  ? b.person?.position
                  : b.space?.location;

                return (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${
                          isAppt ? "bg-indigo-600" : "bg-teal-600"
                        }`}
                      >
                        {titleName?.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {titleName}
                          </span>
                          <Badge
                            color={isAppt ? "indigo" : "teal"}
                            size="sm"
                          >
                            {isAppt ? "Appointment" : "Parking"}
                          </Badge>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                          <span>{subDetail}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-700">
                            {formatLongDate(b.date)}
                          </span>
                          <span>•</span>
                          <span>
                            {b.startTime}–{b.endTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <StatusBadge status={b.status} />
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => setSelectedBooking(b)}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================= DETAILS MODAL ================= */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
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
                variant="primary"
                size="sm"
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

