import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  api,
  apiErrorMessage,
  clearAuth,
  getRefreshToken,
  onAuthCleared,
} from "../api/client";

const AuthContext = createContext(null);

const AUTH_KEY = "pulsebook.auth";
const REFRESH_KEY = "pulsebook.refresh";

function readSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw).user || null;
  } catch {
    // ignore corrupt session storage
  }
  return null;
}

function setSession(token, user, refreshToken) {
  try {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ token, user }));
      if (refreshToken) {
        localStorage.setItem(REFRESH_KEY, refreshToken);
      }
    } else {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(REFRESH_KEY);
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

  // The API client clears storage on logout or on a 401 it cannot recover from.
  // Mirror that into React state so ProtectedRoute redirects to /login.
  useEffect(() => onAuthCleared(() => setUser(null)), []);

  // Sessions no longer expire, so they stay signed in until the user logs out.
  // That makes cross-tab sync matter: a logout in one tab must end the session
  // in every other tab, which the `storage` event reports across documents.
  useEffect(() => {
    function handleStorage(event) {
      if (event.key === AUTH_KEY && event.newValue === null) {
        setUser(null);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(() => {
    async function login(email, password) {
      const { data } = await api.post("/auth/login", { email, password });
      const next = toPublicUser(data.user);
      setSession(data.access_token, next, data.refresh_token);
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
      setSession(data.access_token, next, data.refresh_token);
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
      setSession(data.access_token, next, data.refresh_token);
      setUser(next);
      return next;
    }

    function logout() {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        api
          .post("/auth/logout", { refresh_token: refreshToken })
          .catch(() => {});
      }
      clearAuth();
      setUser(null);
    }

    // Re-read the user from the API and persist it, so a profile edit in
    // Settings is reflected in the sidebar and survives a reload.
    async function refreshUser() {
      const { data } = await api.get("/auth/me");
      const next = toPublicUser(data);
      try {
        const raw = localStorage.getItem(AUTH_KEY);
        const session = raw ? JSON.parse(raw) : null;
        if (session) {
          localStorage.setItem(
            AUTH_KEY,
            JSON.stringify({ token: session.token, user: next }),
          );
        }
      } catch {
        // best-effort write; ignore failures
      }
      setUser(next);
      return next;
    }

    return { user, login, register, registerSpecialist, logout, refreshUser };
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
