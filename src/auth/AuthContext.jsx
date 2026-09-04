import { createContext, useContext, useMemo, useState } from "react";
import { api, apiErrorMessage, clearAuth } from "../api/client";

const AuthContext = createContext(null);

const AUTH_KEY = "pulsebook.auth";

function readSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw).user || null;
  } catch {
    // ignore corrupt session storage
  }
  return null;
}

function setSession(token, user) {
  try {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ token, user }));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  } catch {
    // best-effort write; ignore failures
  }
}

// Public (safe) view of a user — never expose the password.
function toPublicUser({ id, name, email, role, person_id }) {
  return { id, name, email, role, person_id };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  const value = useMemo(() => {
    async function login(email, password) {
      const { data } = await api.post("/auth/login", { email, password });
      const next = toPublicUser(data.user);
      setSession(data.access_token, next);
      setUser(next);
      return next;
    }

    async function register(name, email, password) {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
      });
      const next = toPublicUser(data.user);
      setSession(data.access_token, next);
      setUser(next);
      return next;
    }

    async function registerSpecialist(name, email, password, position) {
      const { data } = await api.post("/auth/register-specialist", {
        name,
        email,
        password,
        position,
      });
      const next = toPublicUser(data.user);
      setSession(data.access_token, next);
      setUser(next);
      return next;
    }

    function logout() {
      clearAuth();
      setUser(null);
    }

    return { user, login, register, registerSpecialist, logout };
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
