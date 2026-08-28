import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import RequireAuth from "./auth/RequireAuth";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Parking from "./pages/Parking";
import ParkingBooking from "./pages/ParkingBooking";
import Appointments from "./pages/Appointments";
import MyBookings from "./pages/MyBookings";
import StaffAppointments from "./pages/StaffAppointments";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <MainLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/parking" element={<Parking />} />
            <Route path="/parking/book/:id" element={<ParkingBooking />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route
              path="/staff/appointments"
              element={<StaffAppointments />}
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
