import { createContext, useContext, useMemo, useState } from "react";
import { delay } from "../api/client";
import { apiErrorMessage } from "../api/client";

const AuthContext = createContext(null);

const AUTH_KEY = "pulsebook.auth";
const USERS_KEY = "pulsebook.users";

// Seed demo accounts. Password is plain in this demo.
const SEED_USERS = [
  { id: "u-alice", name: "Alice Johnson", email: "alice@example.com", password: "password123", role: "CLIENT" },
  { id: "u-carol", name: "Dr. Carol Reyes", email: "carol@example.com", password: "password123", role: "STAFF" },
];

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt user storage
  }
  return SEED_USERS;
}

function persistUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // best-effort write; ignore failures
  }
}

function readSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw).user || null;
  } catch {
    // ignore corrupt session storage
  }
  return null;
}

function setSession(user) {
  try {
    if (user) {
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify({ token: `demo-${user.id}-${Date.now()}`, user }),
      );
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  } catch {
    // best-effort write; ignore failures
  }
}

// Public (safe) view of a user — never expose the password.
function toPublicUser({ id, name, email, role }) {
  return { id, name, email, role };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  const value = useMemo(() => {
    async function login(email, password) {
      await delay();
      const users = readUsers();
      const found = users.find(
        (u) =>
          u.email.trim().toLowerCase() === String(email).trim().toLowerCase() &&
          u.password === password,
      );
      if (!found) {
        throw new Error("Invalid email or password. Please try again.");
      }
      const next = toPublicUser(found);
      setSession(next);
      setUser(next);
      return next;
    }

    async function register(name, email, password) {
      await delay();
      const users = readUsers();
      const exists = users.some(
        (u) => u.email.trim().toLowerCase() === String(email).trim().toLowerCase(),
      );
      if (exists) {
        throw new Error("An account with this email already exists.");
      }
      const newUser = {
        id: `u-${Date.now()}`,
        name: String(name).trim(),
        email: String(email).trim(),
        password,
        role: "CLIENT",
      };
      persistUsers([...users, newUser]);
      const next = toPublicUser(newUser);
      setSession(next);
      setUser(next);
      return next;
    }

    function logout() {
      setSession(null);
      setUser(null);
    }

    return { user, login, register, logout };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Context files legitimately export hooks/utilities alongside the provider.
/* eslint-disable react-refresh/only-export-components */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

// Convenience re-export used by Login.jsx.
export { apiErrorMessage };
/* eslint-enable react-refresh/only-export-components */
