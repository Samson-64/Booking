import {
  SEED_SPACES,
  SEED_PEOPLE,
  SEED_USERS,
  buildSeedBookings,
} from './seedData'

const USERS_KEY = 'booking_mock_users'
const BOOKINGS_KEY = 'booking_mock_bookings'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be unavailable (private mode); fail silently.
  }
}

// Users = seed users + any registered offline accounts (overrides keyed by id).
export const db = {
  getUsers() {
    const stored = readJSON(USERS_KEY, null)
    if (!stored) return SEED_USERS
    const map = new Map(SEED_USERS.map((u) => [u.id, u]))
    for (const u of stored) map.set(u.id, u)
    return Array.from(map.values())
  },

  addUser(user) {
    const users = this.getUsers().filter((u) => u.id !== user.id)
    users.push(user)
    writeJSON(USERS_KEY, users)
    return user
  },

  getBookings() {
    // Re-anchor the derived seed bookings each load.
    const seed = buildSeedBookings()
    const seedMap = new Map(seed.map((b) => [b.id, b]))
    const stored = readJSON(BOOKINGS_KEY, [])
    for (const b of stored) {
      // Never let a stored copy overwrite a re-anchored seed booking.
      if (!seedMap.has(b.id)) seedMap.set(b.id, b)
    }
    return Array.from(seedMap.values())
  },

  saveBooking(booking) {
    const bookings = this.getBookings().filter((b) => b.id !== booking.id)
    bookings.push(booking)
    writeJSON(BOOKINGS_KEY, bookings)
    return booking
  },

  getSpaces() {
    return SEED_SPACES
  },

  getPeople() {
    return SEED_PEOPLE
  },
}

export function peopleById() {
  return new Map(SEED_PEOPLE.map((p) => [p.id, p]))
}

export function spacesById() {
  return new Map(SEED_SPACES.map((s) => [s.id, s]))
}
