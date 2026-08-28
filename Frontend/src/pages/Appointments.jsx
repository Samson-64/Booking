import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createAppointment,
  fetchAppointmentAvailability,
  fetchPeople,
} from "../api/booking";
import { apiErrorMessage } from "../api/client";
import Card from "../components/Card";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { Select } from "../components/Fields";
import {
  formatShortDate,
  formatLongDate,
  todayLocalStr,
} from "../utils/format";

const DAYS_AHEAD = 14;

// 30-minute time options, e.g. "09:00", "09:30", ...
const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (const m of ["00", "30"]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${m}`);
  }
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

// Build the list of selectable dates (today .. today+DAYS_AHEAD).
function buildDates() {
  const out = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${dd}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export default function Appointments() {
  const [people, setPeople] = useState(null);
  const [peopleError, setPeopleError] = useState("");

  const [selectedPerson, setSelectedPerson] = useState(null);
  const dates = useMemo(() => buildDates(), []);

  const [selectedDate, setSelectedDate] = useState("");
  const [availability, setAvailability] = useState(null);
  const [availabilityError, setAvailabilityError] = useState("");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let active = true;
    fetchPeople()
      .then((p) => active && setPeople(p))
      .catch((e) => active && setPeopleError(apiErrorMessage(e)));
    return () => {
      active = false;
    };
  }, []);

  // When a date is selected, fetch availability for the person+date.
  useEffect(() => {
    if (!selectedPerson || !selectedDate) return;
    let active = true;
    fetchAppointmentAvailability(selectedPerson.id, selectedDate)
      .then((data) => {
        if (active) {
          setAvailability(data);
          setStartTime("");
          setEndTime("");
          setAvailabilityError("");
        }
      })
      .catch((e) => {
        if (active) {
          setStartTime("");
          setEndTime("");
          setAvailabilityError(apiErrorMessage(e));
        }
      });
    return () => {
      active = false;
    };
  }, [selectedPerson, selectedDate]);

  function selectPerson(person) {
    setSelectedPerson(person);
    setAvailability(null);
    setStartTime("");
    setEndTime("");
  }

  function selectDate(date) {
    setSelectedDate(date);
    setAvailability(null);
    setStartTime("");
    setEndTime("");
  }

  // Validate the chosen window against working hours + existing bookings.
  const timeError = useMemo(() => {
    if (!availability?.working) return "";
    if (!startTime || !endTime) return "Start time and end time are required.";
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    if (end <= start) return "End time must be after the start time.";
    const schedule = availability.schedule;
    if (start < timeToMinutes(schedule.startTime) || end > timeToMinutes(schedule.endTime)) {
      return `Time must be within working hours (${schedule.startTime}–${schedule.endTime}).`;
    }
    const conflict = (availability.existing || []).some((b) =>
      overlaps(start, end, timeToMinutes(b.startTime), timeToMinutes(b.endTime)),
    );
    if (conflict) return "That time window overlaps an existing booking.";
    return "";
  }, [availability, startTime, endTime]);

  const canConfirm =
    availability?.working && startTime && endTime && !timeError && !submitting;

  // End-time options constrained to after the chosen start and within working hours.
  const endTimeOptions = useMemo(() => {
    if (!availability?.working) return [];
    const scheduleEnd = timeToMinutes(availability.schedule.endTime);
    const min = startTime ? timeToMinutes(startTime) : -1;
    return TIME_OPTIONS.filter((t) => {
      const m = timeToMinutes(t);
      return m > min && m <= scheduleEnd;
    });
  }, [availability, startTime]);

  async function handleConfirm() {
    if (!canConfirm) return;
    setSubmitting(true);
    setError("");
    try {
      const appointment = await createAppointment({
        personId: selectedPerson.id,
        date: selectedDate,
        startTime,
        endTime,
      });
      setSuccess({ appointment, person: selectedPerson, date: selectedDate });
    } catch (e) {
      const msg = apiErrorMessage(e);
      setError(msg);
      // Refresh availability after a conflict (someone may have booked the window).
      setAvailability(null);
      setStartTime("");
      setEndTime("");
      fetchAppointmentAvailability(selectedPerson.id, selectedDate)
        .then((data) => setAvailability(data))
        .catch(() => {});
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return <Confirmation success={success} />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select a person, date, and an available time to book an appointment.
        </p>
      </div>

      {error && <ErrorState message={error} />}

      {/* Step 1: Select person */}
      <Card title="Step 1 · Who would you like to book with?">
        {peopleError ? (
          <ErrorState message={peopleError} />
        ) : people === null ? (
          <Spinner label="Loading people…" />
        ) : people.length === 0 ? (
          <EmptyState title="No people available" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {people.map((person) => (
              <button
                key={person.id}
                onClick={() => selectPerson(person)}
                className={`rounded-xl border p-4 text-left transition ${
                  selectedPerson?.id === person.id
                    ? "border-brand-500 bg-brand-50"
                    : "border-gray-200 bg-white hover:border-brand-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    {person.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {person.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {person.position}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Step 2: Select date */}
      <Card title="Step 2 · Select a date">
        {!selectedPerson ? (
          <p className="text-sm text-gray-400">Select a person first.</p>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {dates.map((date) => {
              const isSelected = date === selectedDate;
              const isPast = date < todayLocalStr();
              return (
                <button
                  key={date}
                  disabled={isPast}
                  onClick={() => selectDate(date)}
                  className={`rounded-lg border px-1 py-2 text-center transition ${
                    isSelected
                      ? "border-brand-500 bg-brand-600 text-white"
                      : isPast
                        ? "cursor-not-allowed border-gray-100 text-gray-300"
                        : "border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-brand-50"
                  }`}
                >
                  <div className="text-xs font-medium">
                    {formatShortDate(date).split(" ")[0]}
                  </div>
                  <div className="text-sm font-bold">
                    {formatShortDate(date).split(" ")[1]}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Step 3: Choose start & end time */}
      <Card title="Step 3 · Choose start & end time">
        {!selectedDate ? (
          <p className="text-sm text-gray-400">
            Select a date to set appointment times.
          </p>
        ) : availabilityError && !availability ? (
          <ErrorState message={availabilityError} />
        ) : !availability ? (
          <Spinner label="Loading available times…" />
        ) : !availability.working ? (
          <EmptyState
            icon="🚫"
            title={`${selectedPerson.name} is not available on this day`}
            message="Choose another date."
          />
        ) : (
          <>
            <p className="mb-3 text-sm font-medium text-gray-600">
              {formatLongDate(selectedDate)} · Working hours{" "}
              {availability.schedule.startTime}–{availability.schedule.endTime}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Select
                id="start-time"
                label="Start Time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                <option value="">Select…</option>
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              <Select
                id="end-time"
                label="End Time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              >
                <option value="">Select…</option>
                {endTimeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            {timeError && (
              <p className="mt-3 text-sm font-medium text-red-600">
                {timeError}
              </p>
            )}
          </>
        )}
      </Card>

      {/* Step 4: Confirm */}
      <div className="flex items-center justify-between">
        <div>
          {startTime && endTime && selectedPerson && (
            <p className="text-sm text-gray-600">
              Confirming with{" "}
              <span className="font-semibold">{selectedPerson.name}</span> at{" "}
              <span className="font-semibold">
                {startTime}–{endTime}
              </span>{" "}
              on{" "}
              <span className="font-semibold">
                {formatShortDate(selectedDate)}
              </span>
            </p>
          )}
        </div>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={!canConfirm}
          loading={submitting}
        >
          Confirm Appointment
        </Button>
      </div>
    </div>
  );
}

function Confirmation({ success }) {
  const { appointment, person, date } = success;
  return (
    <Card className="mx-auto max-w-lg border-green-200 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
        ✓
      </div>
      <h2 className="mt-4 text-xl font-bold text-gray-900">
        Appointment Request Submitted
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        This appointment is pending and will be confirmed once accepted.
      </p>
      <div className="mt-4 space-y-2 text-left text-sm">
        <Row label="Person" value={person.name} />
        <Row label="Position" value={person.position} />
        <Row label="Date" value={formatLongDate(date)} />
        <Row
          label="Time"
          value={`${appointment.startTime} – ${appointment.endTime}`}
        />
        <Row label="Appointment ID" value={appointment.reference} />
      </div>
      <Link
        to="/my-bookings"
        className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline"
      >
        View my bookings →
      </Link>
    </Card>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
