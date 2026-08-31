// Booking data layer backed by the FastAPI backend over HTTP.
// Each function maps the backend response into the exact shape the UI pages
// expect (notably: backend "parking_space" is mapped to "space").

import { api, delay } from "./client";

// Map a parking_space sub-object to the "space" shape used throughout the UI.
function toSpace(parkingSpace) {
  if (!parkingSpace) return undefined;
  const { id, name, location } = parkingSpace;
  return { id, name, location };
}

// Map a calendar/booking response into the normalized full-booking shape.
function toBooking(raw) {
  const { id, reference, date, startTime, endTime, status, type, category, person, user } = raw;
  return {
    id,
    reference,
    date,
    startTime,
    endTime,
    status,
    type,
    category,
    person,
    user,
    space: toSpace(raw.parking_space ?? raw.space),
  };
}

// List providers / people.
export async function fetchPeople() {
  await delay(150);
  const { data } = await api.get("/people");
  return data;
}

// List parking spaces. When a date is provided, annotate each space with
// whether it is currently available.
export async function fetchParkingSpaces(date) {
  await delay(150);
  const { data } = await api.get("/parking/spaces", {
    params: date ? { date } : {},
  });
  return data;
}

// Return the reserved time windows for a parking space on a given date.
export async function fetchParkingAvailability(spaceId, date) {
  const { data } = await api.get(`/parking/spaces/${spaceId}/availability`, {
    params: { date },
  });
  return data;
}

// Reserve a parking space for a time window.
export async function createParkingBooking({ parkingSpaceId, date, startTime, endTime }) {
  const { data } = await api.post("/parking/book", {
    parkingSpaceId,
    date,
    startTime,
    endTime,
  });
  return data;
}

// Check a provider's availability on a given date.
export async function fetchAppointmentAvailability(personId, date) {
  const { data } = await api.get("/appointments/availability", {
    params: { person_id: personId, date },
  });
  return data;
}

// Book an appointment with a provider.
export async function createAppointment({ personId, date, startTime, endTime }) {
  const { data } = await api.post("/appointments", {
    personId,
    date,
    startTime,
    endTime,
  });
  return data;
}

// All appointments (staff management view).
export async function fetchAllAppointments() {
  const { data } = await api.get("/bookings/all");
  return data
    .filter((b) => b.type === "APPOINTMENT")
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
    .map(toBooking);
}

// Update a booking's status (staff).
export async function updateAppointmentStatus(id, status) {
  const { data } = await api.patch(`/bookings/${id}/status`, { status });
  return toBooking(data);
}

// All bookings for the current signed-in user with derived category.
export async function fetchMyBookings() {
  const { data } = await api.get("/bookings");
  return data.map(toBooking);
}

// All appointments assigned to the current provider.
export async function fetchMySpecialistAppointments() {
  const { data } = await api.get("/specialist/my-appointments");
  return data.map(toBooking);
}

// Update a booking's status (provider — restricted to own appointments).
export async function updateSpecialistAppointmentStatus(id, status) {
  const { data } = await api.patch(`/specialist/bookings/${id}/status`, { status });
  return toBooking(data);
}
