import axios from 'axios'

// Centralized axios instance. Attaches the stored JWT on every request and
// clears the session when the token is no longer valid.
const client = axios.create({
  baseURL: '/api',
})

const TOKEN_KEY = 'booking_token'
const USER_KEY = 'booking_user'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
  getStoredUser: () => {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
}

client.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function apiErrorMessage(err) {
  if (err?.response?.data?.error) return err.response.data.error
  if (err?.message) return err.message
  return 'An unexpected error occurred'
}

export default client
