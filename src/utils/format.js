// Formatting helpers shared across the app.

// Return the local date as "YYYY-MM-DD".
export function todayLocalStr() {
  return toDateKey(new Date());
}

// Convert a Date (or date string) to "YYYY-MM-DD" in the local timezone.
function toDateKey(date) {
  const d = typeof date === "string" ? new Date(`${date}T12:00:00`) : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Short readable date, e.g. "Mon 28".
export function formatShortDate(dateKey) {
  const d = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}

// Long readable date, e.g. "Monday, August 28, 2026".
export function formatLongDate(dateKey) {
  const d = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
