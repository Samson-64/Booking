// Demo booking data layer. Everything is persisted in localStorage so the
// frontend is fully functional without a backend or database yet.
//
// The auth module exposes the current signed-in user via getCurrentUser()
// (or null when signed out); bookings are associated with that user.

import { delay } from "./client";
import { todayLocalStr } from "../utils/format";

// ---------------------------------------------------------------------------
// Seed reference data
// ---------------------------------------------------------------------------

const PEOPLE = [
  { id: "p1", name: "Dr. Jane Smith", position: "Cardiologist" },
  { id: "p2", name: "Dr. Marcus Lee", position: "Neurologist" },
  { id: "p3", name: "Dr. Priya Patel", position: "Dermatologist" },
  { id: "p4", name: "Dr. Alan Grant", position: "Orthopedic Surgeon" },
  { id: "p5", name: "Nurse Rebecca Ortiz", position: "General Practitioner" },
];

const SPACES = [
  { id: "s1", name: "S-01", location: "Level 1" },
  { id: "s2", name: "S-02", location: "Level 1" },
  { id: "s3", name: "S-03", location: "Level 1" },
  { id: "s4", name: "S-04", location: "Level 2" },
  { id: "s5", name: "S-05", location: "Level 2" },
  { id: "s6", name: "S-06", location: "Level 2" },
  { id: "s7", name: "S-07", location: "Level 3" },
  { id: "s8", name: "S-08", location: "Level 3" },
];

const SCHEDULE = { startTime: "09:00", endTime: "17:00" };

const BOOKINGS_KEY = "pulsebook.bookings";
const SEEDED_KEY = "pulsebook.seeded";

// Alphanumeric (no ambiguous chars) reference generator.
function makeReference(prefix) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${code}`;
}

// Add days to a "YYYY-MM-DD" key.
function addDays(dateKey, days) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, "0"),
    String(dt.getDate()).padStart(2, "0"),
  ].join("-");
}

// Derive category used by the dashboard / my-bookings. Category reflects
// whether a booking is still ahead (UPCOMING) or in the past (COMPLETED),
// regardless of its approval status (which lives on `status`).
function categorize(booking, user) {
  if (booking.user?.id !== user?.id) return null;
  return booking.date >= todayLocalStr() ? "UPCOMING" : "COMPLETED";
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function loadBookings() {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore corrupt storage */
  }
  return null;
}

function saveBookings(list) {
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
  } catch {
    /* ignore write failures (private mode etc.) */
  }
}

// Lazily seed demo bookings on first use so the dashboard has data.
function ensureBookings() {
  const existing = loadBookings();
  if (existing) return existing;

  const today = todayLocalStr();
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  const user = { id: "u-alice", name: "Alice Johnson", email: "alice@example.com" };

  const seeded = [
    { id: "b1", type: "APPOINTMENT", person: PEOPLE[0], user, date: today, startTime: "09:00", endTime: "09:30", status: "CONFIRMED", reference: makeReference("MA") },
    { id: "b2", type: "PARKING", space: SPACES[0], user, date: today, startTime: "08:30", endTime: "10:30", status: "CONFIRMED", reference: makeReference("PK") },
    { id: "b3", type: "PARKING", space: SPACES[3], user, date: today, startTime: "09:00", endTime: "11:00", status: "CONFIRMED", reference: makeReference("PK") },
    { id: "b4", type: "APPOINTMENT", person: PEOPLE[1], user, date: tomorrow, startTime: "14:00", endTime: "14:30", status: "PENDING", reference: makeReference("MA") },
    { id: "b5", type: "PARKING", space: SPACES[4], user, date: tomorrow, startTime: "11:00", endTime: "12:00", status: "PENDING", reference: makeReference("PK") },
    { id: "b6", type: "APPOINTMENT", person: PEOPLE[2], user, date: nextWeek, startTime: "10:00", endTime: "10:30", status: "COMPLETED", reference: makeReference("MA") },
    { id: "b7", type: "PARKING", space: SPACES[1], user, date: nextWeek, startTime: "10:00", endTime: "12:00", status: "COMPLETED", reference: makeReference("PK") },
    { id: "b8", type: "APPOINTMENT", person: PEOPLE[3], user, date: addDays(today, -2), startTime: "15:00", endTime: "16:00", status: "CANCELLED", reference: makeReference("MA") },
  ];

  saveBookings(seeded);
  try {
    localStorage.setItem(SEEDED_KEY, "1");
  } catch {
    // best-effort marker write; ignore failures
  }
  return seeded;
}

// Imported lazily by the auth module to keep the graph acyclic.
function getCurrentUser() {
  try {
    const raw = localStorage.getItem("pulsebook.auth");
    if (raw) return JSON.parse(raw).user || null;
  } catch {
    // ignore corrupt session storage
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// List specialists / doctors.
export async function fetchPeople() {
  await delay();
  return [...PEOPLE];
}

// List parking spaces. When a date is provided, annotate each space with
// whether it is currently available (not occupied by a non-cancelled booking).
export async function fetchParkingSpaces(date) {
  await delay();
  const bookings = ensureBookings();
  const target = date || todayLocalStr();
  return SPACES.map((space) => {
    const occupied = bookings.some(
      (b) =>
        b.type === "PARKING" &&
        b.space?.id === space.id &&
        b.date === target &&
        b.status !== "CANCELLED",
    );
    return { ...space, available: !occupied };
  });
}

// Return the reserved time windows for a parking space on a given date.
export async function fetchParkingAvailability(spaceId, date) {
  await delay();
  const bookings = ensureBookings();
  const windows = bookings
    .filter(
      (b) =>
        b.type === "PARKING" &&
        b.space?.id === spaceId &&
        b.date === date &&
        b.status !== "CANCELLED",
    )
    .map((b) => ({ startTime: b.startTime, endTime: b.endTime }));
  return { bookings: windows };
}

// Reserve a parking space for a time window.
export async function createParkingBooking({ parkingSpaceId, date, startTime, endTime }) {
  await delay();
  const space = SPACES.find((s) => s.id === parkingSpaceId);
  if (!space) {
    throw new Error("That parking space could not be found.");
  }

  const bookings = ensureBookings();
  const conflict = bookings.some(
    (b) =>
      b.type === "PARKING" &&
      b.space?.id === space.id &&
      b.date === date &&
      b.status !== "CANCELLED" &&
      startTime < b.endTime &&
      endTime > b.startTime,
  );
  if (conflict) {
    throw new Error("That parking slot is already reserved for this time window.");
  }

  const booking = {
    id: `b-${Date.now()}`,
    type: "PARKING",
    space,
    user: getCurrentUser(),
    date,
    startTime,
    endTime,
    status: "CONFIRMED",
    reference: makeReference("PK"),
  };

  saveBookings([booking, ...bookings]);
  return {
    id: booking.id,
    reference: booking.reference,
    date,
    startTime,
    endTime,
    status: booking.status,
  };
}

// Check a specialist's availability on a given date.
export async function fetchAppointmentAvailability(personId, date) {
  await delay();
  const bookings = ensureBookings();
  const existing = bookings
    .filter(
      (b) =>
        b.type === "APPOINTMENT" &&
        b.person?.id === personId &&
        b.date === date &&
        b.status !== "CANCELLED",
    )
    .map((b) => ({ startTime: b.startTime, endTime: b.endTime }));

  return { working: true, schedule: { ...SCHEDULE }, existing };
}

// Book an appointment with a specialist.
export async function createAppointment({ personId, date, startTime, endTime }) {
  await delay();
  const person = PEOPLE.find((p) => p.id === personId);
  if (!person) {
    throw new Error("That specialist could not be found.");
  }
  if (startTime < SCHEDULE.startTime || endTime > SCHEDULE.endTime) {
    throw new Error(`Time must be within working hours (${SCHEDULE.startTime}-${SCHEDULE.endTime}).`);
  }

  const bookings = ensureBookings();
  const conflict = bookings.some(
    (b) =>
      b.type === "APPOINTMENT" &&
      b.person?.id === personId &&
      b.date === date &&
      b.status !== "CANCELLED" &&
      startTime < b.endTime &&
      endTime > b.startTime,
  );
  if (conflict) {
    throw new Error("That time window overlaps an existing booking.");
  }

  const booking = {
    id: `b-${Date.now()}`,
    type: "APPOINTMENT",
    person,
    user: getCurrentUser(),
    date,
    startTime,
    endTime,
    status: "PENDING",
    reference: makeReference("MA"),
  };

  saveBookings([booking, ...bookings]);
  return {
    id: booking.id,
    reference: booking.reference,
    date,
    startTime,
    endTime,
    status: booking.status,
  };
}

// All appointments (staff management view).
export async function fetchAllAppointments() {
  await delay();
  const bookings = ensureBookings();
  return bookings
    .filter((b) => b.type === "APPOINTMENT")
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
}

// Update an appointment's status (staff).
export async function updateAppointmentStatus(id, status) {
  await delay();
  const bookings = ensureBookings();
  const target = bookings.find((b) => b.id === id);
  if (!target) {
    throw new Error("Appointment could not be found.");
  }
  const updated = { ...target, status };
  saveBookings(bookings.map((b) => (b.id === id ? updated : b)));
  return updated;
}

// All bookings for the current signed-in user with derived category.
export async function fetchMyBookings() {
  await delay();
  const bookings = ensureBookings();
  const user = getCurrentUser();
  return bookings
    .filter((b) => b.user?.id === user?.id)
    .map((b) => ({ ...b, category: categorize(b, user) }));
}
