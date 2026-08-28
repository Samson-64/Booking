
export const USE_MOCK = true

export const APPOINTMENT_DURATION_MINUTES = 30

export const SEED_USERS = [
  { id: 'u-alice', name: 'Alice Customer', email: 'alice@example.com', password: 'password123', role: 'CUSTOMER' },
  { id: 'u-bob', name: 'Bob Customer', email: 'bob@example.com', password: 'password123', role: 'CUSTOMER' },
  { id: 'u-staff', name: 'Staff Manager', email: 'staff@example.com', password: 'password123', role: 'STAFF' },
]

// People (providers) with their weekly schedules.
export const SEED_PEOPLE = [
  {
    id: 'p-john',
    name: 'John Smith',
    position: 'Consultant',
    schedules: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }],
  },
  {
    id: 'p-mary',
    name: 'Mary Johnson',
    position: 'Manager',
    schedules: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    ],
  },
  {
    id: 'p-david',
    name: 'David William',
    position: 'Technician',
    schedules: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '16:00' },
    ],
  },
]

export const SEED_SPACES = [
  { id: 'sp-p01', name: 'P-01', level: 'Ground Floor', location: 'Ground Floor' },
  { id: 'sp-p02', name: 'P-02', level: 'Ground Floor', location: 'Ground Floor' },
  { id: 'sp-p03', name: 'P-03', level: 'Level 1', location: 'Level 1' },
  { id: 'sp-p04', name: 'P-04', level: 'Level 1', location: 'Level 1' },
  { id: 'sp-p05', name: 'P-05', level: 'Level 2', location: 'Level 2' },
  { id: 'sp-p06', name: 'P-06', level: 'Surge 2', location: 'Surge 2' },
]

export function buildSeedBookings() {
  return []
}
