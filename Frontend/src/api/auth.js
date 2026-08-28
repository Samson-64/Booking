import client, { tokenStore } from './client'
import { USE_MOCK } from './seedData'
import { db } from './db'

// Public shape of a user returned to the app/auth context.
function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

function mockLogin(email, password) {
  const normalised = email.trim().toLowerCase()
  const user = db
    .getUsers()
    .find((u) => u.email.toLowerCase() === normalised)
  if (!user || user.password !== password) {
    const err = new Error('Invalid email or password')
    err.response = { data: { error: 'Invalid email or password' }, status: 401 }
    throw err
  }
  const fakeToken = `mock.${user.id}.${Date.now()}`
  tokenStore.set(fakeToken)
  tokenStore.setUser(toPublicUser(user))
  return toPublicUser(user)
}

function mockRegister(name, email, password) {
  const user = db.addUser({
    id: `u-${Date.now()}`,
    name,
    email: email.trim().toLowerCase(),
    password,
    role: 'CUSTOMER',
  })
  const fakeToken = `mock.${user.id}.${Date.now()}`
  tokenStore.set(fakeToken)
  tokenStore.setUser(toPublicUser(user))
  return toPublicUser(user)
}

export async function login(email, password) {
  if (USE_MOCK) {
    // Small delay so the UI's loading state is visible/realistic.
    await new Promise((r) => setTimeout(r, 150))
    return mockLogin(email, password)
  }
  const { data } = await client.post('/auth/login', { email, password })
  tokenStore.set(data.token)
  tokenStore.setUser(data.user)
  return data.user
}

export async function register(name, email, password) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 150))
    return mockRegister(name, email, password)
  }
  const { data } = await client.post('/auth/register', { name, email, password })
  tokenStore.set(data.token)
  tokenStore.setUser(data.user)
  return data.user
}
