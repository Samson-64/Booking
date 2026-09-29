import { useEffect, useRef, useState } from "react";
import { apiErrorMessage } from "../api/client";

/**
 * An editable copy of a settings group with its own dirty / saving / saved /
 * error flags and a persist function.
 *
 * Each group in Settings gets its own draft so a group's Save button only ever
 * saves that group, rather than silently submitting the user's unrelated edits
 * in another section.
 */
export function useDraft(initialValue, persist, { autoClearMs = 2500 } = {}) {
  const [value, setValue] = useState(initialValue);
  // The server value this draft was last seeded from, so a late refetch can be
  // recognised and skipped without an effect.
  const [seed, setSeed] = useState(initialValue);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const timer = useRef(null);

  // Re-seed when a new server value arrives, but only while untouched, so a
  // refetch cannot stomp on edits in progress. Adjusting state during render
  // (rather than in an effect) avoids a wasted second render pass.
  if (initialValue != null && initialValue !== seed && !dirty && !saving) {
    setSeed(initialValue);
    setValue(initialValue);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function edit(patch) {
    setValue((prev) => ({ ...prev, ...patch }));
    setDirty(true);
    setSaved(false);
    clearTimeout(timer.current);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const persisted = await persist(value);
      if (persisted) setSeed(persisted);
      setDirty(false);
      setSaved(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setSaved(false), autoClearMs);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return { value, edit, save, dirty, saving, saved, error };
}
