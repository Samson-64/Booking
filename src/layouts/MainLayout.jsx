import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  LayoutDashboard,
  CalendarDays,
  Car,
  BookmarkCheck,
  CalendarCheck,
  Users,
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  // Sparkles,
} from "lucide-react";

function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isStaff = user?.role === "STAFF";
  const isSpecialist = user?.role === "SPECIALIST";

  const navItems = [
    ...(isSpecialist
      ? [
          {
            to: "/specialist",
            label: "My Appointments",
            icon: Users,
            end: false,
            badge: "Provider",
          },
        ]
      : []),
    { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/appointments", label: "Appointments", icon: CalendarDays },
    { to: "/parking", label: "Parking", icon: Car },
    { to: "/my-bookings", label: "My Bookings", icon: BookmarkCheck },
    ...(isStaff
      ? [
          {
            to: "/staff/appointments",
            label: "Manage Appts",
            icon: CalendarCheck,
            end: false,
            badge: "Staff",
          },
        ]
      : []),
  ];

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  // Format today's date nicely for top bar
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-navy-900 text-slate-300 lg:flex rounded-3xl border-10 border-white overflow-hidden">
        <div>
          {/* Logo & Brand Header */}
          <div className="flex h-20 items-center justify-between px-6 border-b  border-slate-800/80">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-xl font-bold tracking-tight text-white">
                  Booking Portal
                </span>
              </div>
            </div>
          </div>

          {/* <div className="hidden md:flex items-center">
            <div className="relative w-72 lg:w-96">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search appointments, slots, providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-slate-200 py-2 pl-10 pr-12 text-xs text-slate-800 placeholder-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-3 focus:ring-teal-500/5"
              />
            </div>
          </div> */}

          {/* Navigation Links */}
          <div className="px-3 py-6">
            <div className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Main Menu
            </div>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `group relative flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-white text-slate-900 shadow-md font-semibold"
                          : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 transition-colors"/>
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isActive
                                ? "bg-teal-100 text-teal-800"
                                : "bg-teal-900/60 text-teal-300 border border-teal-700/50"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Dock Utilities */}
        <div className="border-t border-slate-800/80 p-4 space-y-1">
          {/* Quick role highlight banner */}
          <div className="mb-3 rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                {isStaff
                  ? "Staff Portal Active"
                  : isSpecialist
                    ? "Provider Portal"
                    : "Client Portal"}
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  isStaff
                    ? "bg-amber-400 animate-pulse"
                    : isSpecialist
                      ? "bg-indigo-400"
                      : "bg-teal-400"
                }`}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400 truncate">
              {user?.email}
            </p>
          </div>

          {isSpecialist && (
            <button
              onClick={() => navigate("/specialist")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>My Appointments</span>
            </button>
          )}

          <button
            onClick={() => navigate("/my-bookings")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Preferences</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
              <span className="ml-auto h-2 w-2 rounded-full bg-teal-400" />
            </button>

            {notificationsOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
                  <span className="text-xs font-semibold text-slate-800">
                    Notifications
                  </span>
                  <span className="text-[10px] text-teal-600 font-medium">
                    All caught up
                  </span>
                </div>
                <div className="py-3 px-1 text-xs text-slate-500 space-y-2">
                  <div className="rounded-lg bg-teal-50/60 p-2 border border-teal-100/60">
                    <p className="font-semibold text-teal-900">System Ready</p>
                    <p className="text-[11px] text-teal-700 mt-0.5">
                      Real-time appointment and parking sync active.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TOP APP BAR */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-8">
          {/* Mobile menu toggle & brand */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                Booking Portal
              </span>
            </div>
          </div>

          {/* Search bar with shortcut tag */}
          <div className="hidden md:flex items-center">
            <div className="relative w-72 lg:w-96">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search appointments, slots, providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-slate-200 py-2 pl-10 pr-12 text-xs text-slate-800 placeholder-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-3 focus:ring-teal-500/5"
              />
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* date display */}
            <div className="hidden xl:flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600">
              <CalendarDays className="h-3.5 w-3.5 text-sleat-900" />
              <span>{todayFormatted}</span>
            </div>

            {/* User Avatar (no dropdown) */}
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-white shadow-2xs cursor-pointer"
              aria-label="Account"
            >
              <User className="text-slate-900" />
            </button>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet context={{ searchQuery }} />
          </div>
        </main>
      </div>

      {/* ================= MOBILE DRAWER ================= */}
      <div
        className={`fixed inset-0 z-50 flex transition-none lg:hidden ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-500 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer content */}
        <div
          className={`relative flex w-72 flex-col justify-between bg-navy-900 p-6 text-slate-300 shadow-2xl z-10 transition-transform duration-500 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                {/* <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-white">
                  <Sparkles className="h-5 w-5" />
                </div> */}
                <span className="text-base font-bold text-white">
                  Booking Portal
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-6 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-white text-slate-900 shadow-md font-semibold"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`h-5 w-5 ${
                              isActive ? "text-teal-600" : "text-slate-400"
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-1">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
              <span className="ml-auto h-2 w-2 rounded-full bg-teal-400" />
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-950/40"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainLayout;
