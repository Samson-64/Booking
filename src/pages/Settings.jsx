import { useMemo, useState } from "react";
import { LogOut, ShieldCheck, User } from "lucide-react";
import { apiErrorMessage } from "../api/client";
import {
  changePassword,
  logoutAllSessions,
  updateProfile,
} from "../api/settings";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../auth/AuthContext";
import { useDraft } from "../hooks/useDraft";
import Button from "../components/Button";
import Toggle from "../components/Toggle";
import { Input, Select } from "../components/Fields";
import ErrorState from "../components/ErrorState";
import Spinner from "../components/Spinner";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "pt", label: "Portuguese" },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];
const REMINDER_LEADS = [15, 30, 60, 120, 240, 1440];

function Section({ step, title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Banner({ kind, message }) {
  if (!message) return null;
  const tone =
    kind === "error"
      ? "bg-rose-50 text-rose-700"
      : "bg-emerald-50 text-emerald-700";
  return (
    <div
      className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${tone}`}
    >
      {message}
    </div>
  );
}

function SaveRow({ draft, label = "Save changes" }) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
      {draft.saved && (
        <span className="text-xs font-semibold text-emerald-600">Saved</span>
      )}
      <Button
        size="sm"
        onClick={draft.save}
        loading={draft.saving}
        disabled={!draft.dirty || draft.saving}
      >
        {label}
      </Button>
    </div>
  );
}

function leadLabel(minutes) {
  if (minutes >= 1440) return "1 day before";
  if (minutes >= 60) {
    return `${minutes / 60} hour${minutes > 60 ? "s" : ""} before`;
  }
  return `${minutes} minutes before`;
}

export default function Settings() {
  const { settings, loading, error, reload, save } = useSettings();
  const { user, refreshUser, logout } = useAuth();

  const notifications = useDraft(
    settings && {
      notifyBookingUpdates: settings.notifyBookingUpdates,
      notifyNewBookings: settings.notifyNewBookings,
      notifyReminders: settings.notifyReminders,
      reminderMinutesBefore: settings.reminderMinutesBefore,
      quietHoursEnabled: settings.quietHoursEnabled,
      quietHoursStart: settings.quietHoursStart,
      quietHoursEnd: settings.quietHoursEnd,
    },
    (value) =>
      save({
        ...value,
        reminderMinutesBefore: Number(value.reminderMinutesBefore),
      }),
  );

  const booking = useDraft(
    settings && {
      language: settings.language,
      timezone: settings.timezone,
      defaultDurationMinutes: settings.defaultDurationMinutes,
      preferredParkingFloor: settings.preferredParkingFloor ?? "",
    },
    (value) =>
      save({
        ...value,
        defaultDurationMinutes: Number(value.defaultDurationMinutes),
        preferredParkingFloor: value.preferredParkingFloor.trim() || null,
      }),
  );

  const profile = useDraft(user && { name: user.name, email: user.email }, async (value) => {
    await updateProfile({ name: value.name.trim(), email: value.email.trim() });
    return refreshUser();
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const [sessionsSaving, setSessionsSaving] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);

  const passwordProblem = useMemo(() => {
    if (passwords.newPassword && passwords.newPassword.length < 8) {
      return "New password must be at least 8 characters";
    }
    if (
      passwords.confirmPassword &&
      passwords.newPassword !== passwords.confirmPassword
    ) {
      return "The two passwords do not match";
    }
    return null;
  }, [passwords]);

  async function savePassword(event) {
    event.preventDefault();
    if (passwordProblem) return;
    setPasswordSaving(true);
    setPasswordError(null);
    try {
      await changePassword(passwords.currentPassword, passwords.newPassword);
      // Every session is now invalid, this one included. logout() clears the
      // local token and drops `user`, which makes ProtectedRoute redirect.
      logout();
    } catch (err) {
      setPasswordError(apiErrorMessage(err));
      setPasswordSaving(false);
    }
  }

  async function revokeAll() {
    setSessionsSaving(true);
    setSessionsError(null);
    try {
      await logoutAllSessions();
      logout();
    } catch (err) {
      setSessionsError(apiErrorMessage(err));
      setSessionsSaving(false);
    }
  }

  if (error && !settings) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  if (loading || !settings || !notifications.value || !booking.value) {
    return (
      <div className="mx-auto max-w-3xl">
        <Spinner label="Loading settings" />
      </div>
    );
  }

  const n = notifications.value;
  const b = booking.value;
  const p = profile.value ?? { name: "", email: "" };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-200">
      <header className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account, booking defaults and notification preferences.
        </p>
      </header>

      <Section step={1} title="Account" description="Your name and email address.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            id="profile-name"
            icon={<User className="h-4 w-4" />}
            value={p.name}
            onChange={(e) => profile.edit({ name: e.target.value })}
          />
          <Input
            label="Email address"
            id="profile-email"
            type="email"
            value={p.email}
            onChange={(e) => profile.edit({ email: e.target.value })}
          />
        </div>
        <Banner kind="error" message={profile.error} />
        <Banner
          kind="success"
          message={profile.saved ? "Profile updated" : null}
        />
        <SaveRow draft={profile} />
      </Section>

      <Section
        step={2}
        title="Notifications"
        description="Choose what you hear about, and when."
      >
        <div className="divide-y divide-slate-100">
          <Toggle
            label="Booking updates"
            description="When one of your bookings is confirmed, completed or cancelled."
            checked={n.notifyBookingUpdates}
            onChange={(v) => notifications.edit({ notifyBookingUpdates: v })}
          />
          <Toggle
            label="New bookings"
            description="When a new appointment is assigned to you."
            checked={n.notifyNewBookings}
            onChange={(v) => notifications.edit({ notifyNewBookings: v })}
          />
          <Toggle
            label="Reminders"
            description="A nudge shortly before a booking starts."
            checked={n.notifyReminders}
            onChange={(v) => notifications.edit({ notifyReminders: v })}
          />
        </div>

        {n.notifyReminders && (
          <Select
            label="Remind me"
            id="reminder-lead"
            value={n.reminderMinutesBefore}
            onChange={(e) =>
              notifications.edit({ reminderMinutesBefore: e.target.value })
            }
          >
            {REMINDER_LEADS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {leadLabel(minutes)}
              </option>
            ))}
          </Select>
        )}

        <div className="space-y-1 border-t border-slate-100 pt-1">
          <Toggle
            label="Quiet hours"
            description="Hold reminders during these hours. Booking updates are always kept."
            checked={n.quietHoursEnabled}
            onChange={(v) => notifications.edit({ quietHoursEnabled: v })}
          />
          {n.quietHoursEnabled && (
            <div className="grid gap-4 pb-2 pt-2 sm:grid-cols-2">
              <Input
                label="From"
                id="quiet-start"
                type="time"
                value={n.quietHoursStart}
                onChange={(e) =>
                  notifications.edit({ quietHoursStart: e.target.value })
                }
              />
              <Input
                label="Until"
                id="quiet-end"
                type="time"
                value={n.quietHoursEnd}
                onChange={(e) =>
                  notifications.edit({ quietHoursEnd: e.target.value })
                }
              />
            </div>
          )}
        </div>

        <Banner kind="error" message={notifications.error} />
        <SaveRow draft={notifications} />
      </Section>

      <Section
        step={3}
        title="Booking defaults"
        description="Pre-selected when you make a new booking."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Default duration"
            id="default-duration"
            value={b.defaultDurationMinutes}
            onChange={(e) =>
              booking.edit({ defaultDurationMinutes: e.target.value })
            }
          >
            {DURATIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutes
              </option>
            ))}
          </Select>
          <Input
            label="Preferred parking floor"
            id="preferred-floor"
            placeholder="e.g. Ground"
            value={b.preferredParkingFloor}
            onChange={(e) =>
              booking.edit({ preferredParkingFloor: e.target.value })
            }
            helperText="Leave blank for no preference."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Language"
            id="language"
            value={b.language}
            onChange={(e) => booking.edit({ language: e.target.value })}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </Select>
          <Input
            label="Timezone"
            id="timezone"
            value={b.timezone}
            onChange={(e) => booking.edit({ timezone: e.target.value })}
            helperText="IANA name, e.g. Africa/Johannesburg"
          />
        </div>
        <Banner kind="error" message={booking.error} />
        <SaveRow draft={booking} />
      </Section>

      <Section step={4} title="Security" description="Password and active sessions.">
        <form onSubmit={savePassword} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Current password"
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={passwords.currentPassword}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, currentPassword: e.target.value }))
              }
            />
            <Input
              label="New password"
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, newPassword: e.target.value }))
              }
            />
          </div>
          <Input
            label="Confirm new password"
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            error={passwordProblem ?? undefined}
            value={passwords.confirmPassword}
            onChange={(e) =>
              setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))
            }
            helperText="Changing your password signs you out everywhere, including this device."
          />
          <Banner kind="error" message={passwordError} />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              loading={passwordSaving}
              disabled={
                !passwords.currentPassword ||
                !passwords.newPassword ||
                !passwords.confirmPassword ||
                Boolean(passwordProblem) ||
                passwordSaving
              }
            >
              Update password
            </Button>
          </div>
        </form>

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Sign out of all devices
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Ends every active session, including this one.
            </p>
          </div>
          <Banner kind="error" message={sessionsError} />
          <div className="flex justify-end">
            <Button
              variant="danger"
              size="sm"
              icon={<LogOut className="h-4 w-4" />}
              loading={sessionsSaving}
              onClick={revokeAll}
            >
              Sign out everywhere
            </Button>
          </div>
        </div>
      </Section>

      <p className="flex items-center justify-center gap-1.5 pb-2 text-center text-[11px] text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5" />
        Your settings are stored on your account and follow you to every device.
      </p>
    </div>
  );
}
