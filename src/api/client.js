// Lightweight "API client" helpers for the demo frontend.
// In this demo mode all data is served from localStorage, so the client only
// provides shared utilities (error messages + simulated network latency).

// Normalize any thrown/errored value into a human-readable message.
export function apiErrorMessage(err) {
  if (!err) return "Something went wrong. Please try again.";
  if (typeof err === "string") return err;
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.message) return err.message;
  return "Something went wrong. Please try again.";
}

// Simulate network latency so the UI's loading states render naturally.
export function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
