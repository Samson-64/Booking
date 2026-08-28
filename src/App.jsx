import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Parking from "./pages/Parking";
import ParkingFloor from "./pages/ParkingFloor";
import ParkingBooking from "./pages/ParkingBooking";
import MyBookings from "./pages/MyBookings";
import StaffAppointments from "./pages/StaffAppointments";

// Redirect to /login (remembering where the user was headed) if signed out.
function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/parking" element={<Parking />} />
          <Route path="/parking/floor/:floor" element={<ParkingFloor />} />
          <Route path="/parking/book/:id" element={<ParkingBooking />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/staff/appointments" element={<StaffAppointments />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
