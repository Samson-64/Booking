// User preference + profile endpoints. The backend uses camelCase on the wire,
// so the payloads here are passed through unchanged.

import { api } from "./client";

export async function fetchSettings() {
  const { data } = await api.get("/settings");
  return data;
}

export async function updateSettings(patch) {
  const { data } = await api.patch("/settings", patch);
  return data;
}

export async function updateProfile({ name, email }) {
  const { data } = await api.patch("/settings/profile", { name, email });
  return data;
}

// Always signs the user out everywhere, including here, because access tokens
// carry no expiry. Callers must redirect to /login on success.
export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.post("/settings/profile/password", {
    currentPassword,
    newPassword,
  });
  return data;
}

export async function logoutAllSessions() {
  const { data } = await api.post("/auth/logout-all");
  return data;
}
