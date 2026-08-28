import client, { tokenStore } from './client'
import { USE_MOCK, APPOINTMENT_DURATION_MINUTES } from './seedData'
import { db, peopleById, spacesById } from './db'
import { todayLocalStr } from '../utils/format'

// --- Time helpers (mirror of backend utils) ---
const MIN_PER_HOUR = 60

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * MIN_PER_HOUR + m
}

function toTime(mins) {
  const h = Math.floor(mins / MIN_PER_HOUR)
  const m = mins % MIN_PER_HOUR
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart
}

function dayOfWeek(dateStr) {
  // Match util/format.parseDateStr: local Date at noon to avoid tz shifting.
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0).getDay()
}

// Category used by Dashboard / MyBookings: UPCOMING or COMPLETED.
function bookingCategory(booking, now) {
  const today = todayLocalStr()
  if (booking.date < today) return 'COMPLETED'
  if (booking.date === today && booking.endTime <= now) return 'COMPLETED'
  return 'UPCOMING'
}

function isConfirmed(b) {
  return b.status === 'CONFIRMED'
}

// Appointment slot-blocking statuses: a PENDING request holds the slot until
// accepted or rejected, and a CONFIRMED one keeps it booked.
function isSlotBlocking(b) {
  return b.status === 'PENDING' || b.status === 'CONFIRMED'
}

// CONFIRMED appointment overlaps.
function buildAppointmentSlots(schedule, existing) {
  const start = timeToMinutes(schedule.startTime)
  const end = timeToMinutes(schedule.endTime)
  const slots = []
  const existingTimes = existing.filter(isConfirmed).map((b) => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }))
  for (let t = start; t + APPOINTMENT_DURATION_MINUTES <= end; t += 15) {
    const slotStart = t
    const slotEnd = t + APPOINTMENT_DURATION_MINUTES
    const available = !existingTimes.some(
      (e) => overlaps(slotStart, slotEnd, e.start, e.end),
    )
    slots.push({ start: toTime(slotStart), end: toTime(slotEnd), available })
  }
  return slots
}

// --- Mock implementations (delegates to the real API via client when USE_MOCK is false) ---

// --- People ---
export async function fetchPeople() {
  if (USE_MOCK) {
    await sleep()
    return db
      .getPeople()
      .map((p) => ({ id: p.id, name: p.name, position: p.position }))
  }
  const { data } = await client.get('/people')
  return data.people
}

// --- Appointments ---
export async function fetchAppointmentAvailability(personId, date) {
  if (USE_MOCK) {
    await sleep()
    const person = peopleById().get(personId)
    if (!person) return { working: false, slots: [], schedule: null, existing: [] }
    const schedule = person.schedules.find((s) => s.dayOfWeek === dayOfWeek(date))
    if (!schedule) {
      return { working: false, slots: [], schedule: null, existing: [] }
    }
    const existing = db
      .getBookings()
      .filter(
        (b) =>
          isSlotBlocking(b) &&
          b.type === 'APPOINTMENT' &&
          b.personId === personId &&
          b.date === date,
      )
      .map((b) => ({ startTime: b.startTime, endTime: b.endTime }))
    return {
      working: true,
      slots: buildAppointmentSlots(schedule, existing),
      schedule: { startTime: schedule.startTime, endTime: schedule.endTime },
      existing,
    }
  }
  const { data } = await client.get('/appointments/availability', {
    params: { personId, date },
  })
  return data
}

export async function createAppointment({ personId, date, startTime, endTime }) {
  if (USE_MOCK) {
    await sleep()
    validateAppointmentWindow(personId, date, startTime, endTime)
    const existing = db.getBookings().filter(
      (b) =>
        isSlotBlocking(b) &&
        b.type === 'APPOINTMENT' &&
        b.personId === personId &&
        b.date === date,
    )
    const newStart = timeToMinutes(startTime)
    const newEnd = timeToMinutes(endTime)
    const conflict = existing.some(
      (b) => overlaps(newStart, newEnd, timeToMinutes(b.startTime), timeToMinutes(b.endTime)),
    )
    if (conflict) throw conflictError('That time window overlaps an existing booking.')
    const booking = db.saveBooking({
      id: `ap-${Date.now()}`,
      userId: currentUserId(),
      personId,
      type: 'APPOINTMENT',
      reference: `AP-${Date.now().toString(36).toUpperCase()}`,
      date,
      startTime,
      endTime,
      status: 'PENDING',
    })
    return booking
  }
  const { data } = await client.post('/appointments', { personId, date, startTime, endTime })
  return data.appointment
}

// --- Staff: manage appointments ---
export async function fetchAllAppointments() {
  if (USE_MOCK) {
    await sleep()
    const people = peopleById()
    const users = db.getUsers()
    const userById = new Map(users.map((u) => [u.id, u]))
    return db
      .getBookings()
      .filter((b) => b.type === 'APPOINTMENT')
      .map((b) => {
        const person = people.get(b.personId)
        const customer = userById.get(b.userId)
        return {
          id: b.id,
          reference: b.reference,
          status: b.status,
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          userId: b.userId,
          user: customer
            ? { id: customer.id, name: customer.name, email: customer.email }
            : undefined,
          person: person
            ? { id: person.id, name: person.name, position: person.position }
            : undefined,
        }
      })
  }
  const { data } = await client.get('/staff/appointments')
  return data.appointments
}

export async function updateAppointmentStatus(id, status) {
  if (USE_MOCK) {
    await sleep()
    const booking = db.getBookings().find((b) => b.id === id)
    if (!booking) throw new Error('Appointment not found')
    const updated = { ...booking, status }
    db.saveBooking(updated)
    return updated
  }
  const { data } = await client.patch(`/staff/appointments/${id}/status`, { status })
  return data.appointment
}

// Validate an appointment window against the provider's schedule and existing
// bookings. Throws an API-style error on failure. Mirrors the real backend rules.
function validateAppointmentWindow(personId, date, startTime, endTime) {
  if (!startTime || !endTime) {
    throw badRequestError('Start time and end time are required.')
  }
  const newStart = timeToMinutes(startTime)
  const newEnd = timeToMinutes(endTime)
  if (newEnd <= newStart) {
    throw badRequestError('End time must be after the start time.')
  }
  const person = peopleById().get(personId)
  const schedule = person?.schedules.find((s) => s.dayOfWeek === dayOfWeek(date))
  if (!schedule) {
    throw badRequestError('This provider is not available on the selected day.')
  }
  const workStart = timeToMinutes(schedule.startTime)
  const workEnd = timeToMinutes(schedule.endTime)
  if (newStart < workStart || newEnd > workEnd) {
    throw badRequestError(
      `Time must be within working hours (${schedule.startTime}–${schedule.endTime}).`,
    )
  }
}

// --- Parking ---
export async function fetchParkingSpaces(date, { startTime, endTime } = {}) {
  if (USE_MOCK) {
    await sleep()
    const bookings = db
      .getBookings()
      .filter((b) => isConfirmed(b) && b.type === 'PARKING' && b.date === date)
    return db.getSpaces().map((space) => {
      const spaceBookings = bookings.filter((b) => b.parkingSpaceId === space.id)
      let occupied
      if (startTime && endTime) {
        occupied = spaceBookings.some((b) =>
          overlaps(timeToMinutes(startTime), timeToMinutes(endTime), timeToMinutes(b.startTime), timeToMinutes(b.endTime)),
        )
      } else {
        occupied = spaceBookings.length > 0
      }
      return {
        id: space.id,
        name: space.name,
        level: space.level,
        location: space.location,
        available: !occupied,
      }
    })
  }
  const { data } = await client.get('/parking/spaces', {
    params: { date, startTime, endTime },
  })
  return data.spaces
}

export async function fetchParkingAvailability(parkingSpaceId, date) {
  if (USE_MOCK) {
    await sleep()
    const bookings = db
      .getBookings()
      .filter(
        (b) =>
          isConfirmed(b) &&
          b.type === 'PARKING' &&
          b.parkingSpaceId === parkingSpaceId &&
          b.date === date,
      )
      .map((b) => ({ startTime: b.startTime, endTime: b.endTime }))
    return { bookings }
  }
  const { data } = await client.get('/parking/availability', {
    params: { parkingSpaceId, date },
  })
  return data
}

export async function createParkingBooking({ parkingSpaceId, date, startTime, endTime }) {
  if (USE_MOCK) {
    await sleep()
    const existing = db.getBookings().filter(
      (b) =>
        isConfirmed(b) &&
        b.type === 'PARKING' &&
        b.parkingSpaceId === parkingSpaceId &&
        b.date === date,
    )
    const newStart = timeToMinutes(startTime)
    const newEnd = timeToMinutes(endTime)
    const conflict = existing.some(
      (b) => overlaps(newStart, newEnd, timeToMinutes(b.startTime), timeToMinutes(b.endTime)),
    )
    if (conflict) throw conflictError('That time window overlaps an existing parking booking.')
    const booking = db.saveBooking({
      id: `pk-${Date.now()}`,
      userId: currentUserId(),
      parkingSpaceId,
      type: 'PARKING',
      reference: `PK-${Date.now().toString(36).toUpperCase()}`,
      date,
      startTime,
      endTime,
      status: 'CONFIRMED',
    })
    return booking
  }
  const { data } = await client.post('/parking/bookings', {
    parkingSpaceId,
    date,
    startTime,
    endTime,
  })
  return data.booking
}

// --- Bookings ---
export async function fetchMyBookings() {
  if (USE_MOCK) {
    await sleep()
    const user = currentUser()
    if (!user) return []
    const now = new Date()
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const people = peopleById()
    const spaces = spacesById()
    return db
      .getBookings()
      .filter((b) => b.userId === user.id)
      .map((b) => {
        const base = {
          id: b.id,
          reference: b.reference,
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status,
          category: bookingCategory(b, nowTime),
        }
        if (b.type === 'APPOINTMENT') {
          const person = people.get(b.personId)
          return { ...base, type: 'APPOINTMENT', person: person ? { name: person.name, position: person.position } : undefined }
        }
        const space = spaces.get(b.parkingSpaceId)
        return { ...base, type: 'PARKING', space: space ? { name: space.name } : undefined }
      })
  }
  const { data } = await client.get('/bookings')
  return data.bookings
}

// --- Small helpers (mock mode only) ---
function sleep(ms = 150) {
  return new Promise((r) => setTimeout(r, ms))
}

function currentUser() {
  return tokenStore.getStoredUser()
}

function currentUserId() {
  const u = currentUser()
  return u ? u.id : null
}

function conflictError(message) {
  const err = new Error(message)
  err.response = { data: { error: message }, status: 409 }
  return err
}

function badRequestError(message) {
  const err = new Error(message)
  err.response = { data: { error: message }, status: 400 }
  return err
}
