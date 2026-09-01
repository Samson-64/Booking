// Lightweight API client for the frontend.
// All requests are sent to the backend via the Vite dev proxy at "/api".

import axios from "axios";

const AUTH_KEY = "pulsebook.auth";

// Shared axios instance. Requests to protected endpoints pick up the stored
// JWT automatically via the request interceptor below.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + "/api",
});

// Attach the stored JWT to every outgoing request, when present.
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      const { token } = JSON.parse(raw);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore corrupt session storage
  }
  return config;
});

// Clear the locally-stored session (used on logout / unauthorized responses).
export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    // best-effort write; ignore failures
  }
}

// Normalize any thrown/errored value into a human-readable message.
export function apiErrorMessage(err) {
  if (!err) return "Something went wrong. Please try again.";
  if (typeof err === "string") return err;
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.response?.data?.detail) return err.response.data.detail;
  if (err?.message) return err.message;
  return "Something went wrong. Please try again.";
}

// Simulate network latency so the UI's loading states render naturally.
export function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
