import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiErrorMessage } from "../api/client";
import { fetchSettings, updateSettings as saveSettings } from "../api/settings";

const SettingsContext = createContext(null);

// Holds the user's preferences so other pages can read them without refetching
// (Appointments defaults its duration, Parking defaults its floor). Settings
// is deliberately not a theme source: this app is light-only.
//
// This provider is mounted only for a signed-in user (see ProtectedRoute), so
// it never has to deal with an anonymous request.
export function SettingsProvider({ children }) {
  // null means "not loaded yet", which is also what drives `loading`. Deriving
  // it avoids a loading flag that has to be set inside the fetch effect.
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);

  // Updates state from a promise callback rather than a bare async body, which
  // keeps the fetch effect free of a synchronous setState.
  const load = useCallback(
    () =>
      fetchSettings()
        .then((next) => {
          setError(null);
          setSettings(next);
        })
        .catch((err) => setError(apiErrorMessage(err))),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (patch) => {
    const next = await saveSettings(patch);
    setSettings(next);
    return next;
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading: settings === null && error === null,
      error,
      reload: load,
      save,
    }),
    [settings, error, load, save],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// Context files legitimately export hooks/utilities alongside the provider.
/* eslint-disable react-refresh/only-export-components */
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
/* eslint-enable react-refresh/only-export-components */
