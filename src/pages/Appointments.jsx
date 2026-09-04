import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createAppointment,
  fetchAppointmentAvailability,
  fetchPeople,
} from "../api/booking";
import { apiErrorMessage } from "../api/client";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { Select } from "../components/Fields";
import Badge from "../components/Badge";
import {
  formatShortDate,
  formatLongDate,
  todayLocalStr,
} from "../utils/format";
import { Clock, AlertCircle, ShieldCheck, Check } from "lucide-react";

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
      .then((p) => {
        if (active) {
          setPeople(p);
          if (p && p.length > 0) {
            setSelectedPerson((prev) => prev || p[0]);
          }
        }
      })
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
    if (
      start < timeToMinutes(schedule.startTime) ||
      end > timeToMinutes(schedule.endTime)
    ) {
      return `Time must be within working hours (${schedule.startTime}–${schedule.endTime}).`;
    }
    const conflict = (availability.existing || []).some((b) =>
      overlaps(
        start,
        end,
        timeToMinutes(b.startTime),
        timeToMinutes(b.endTime),
      ),
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
      // Refresh availability after a conflict
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
    return <Confirmation success={success} onReset={() => setSuccess(null)} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in duration-200">
      {/* Header Section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Book an Appointment
            </h1>
          </div>
        </div>
      </div>

      {error && <ErrorState message={error} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Selection Area (2 Columns) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Step 1: Select person / provider */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  1
                </span>
                <h2 className="text-sm font-bold text-slate-900">
                  Select Provider
                </h2>
              </div>
            </div>

            {peopleError ? (
              <ErrorState message={peopleError} />
            ) : people === null ? (
              <Spinner label="Loading providers…" />
            ) : people.length === 0 ? (
              <EmptyState title="No providers available" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {people.map((person) => {
                  const isSelected = selectedPerson?.id === person.id;
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => selectPerson(person)}
                      className={`group relative flex items-center justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-none bg-teal-50/50 shadow-sm "
                          : "border-none bg-white hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white transition-transform group-hover:scale-105 ${
                            isSelected ? "bg-black/80" : "bg-slate-900"
                          }`}
                        >
                          {person.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 group-hover:text-slate-900">
                            {person.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {person.position}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-600 text-white">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Select date */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  2
                </span>
                <h2 className="text-sm font-bold text-slate-900">
                  Select Date
                </h2>
              </div>
              {selectedDate && (
                <span className="text-xs font-semibold text-slate-900">
                  {formatLongDate(selectedDate)}
                </span>
              )}
            </div>

            {!selectedPerson ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Please select a provider first to view their calendar.
              </p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {dates.map((date) => {
                  const isSelected = date === selectedDate;
                  const isPast = date < todayLocalStr();
                  const short = formatShortDate(date);
                  const [dayOfWeek, dayNumber] = short.split(" ");

                  return (
                    <button
                      key={date}
                      type="button"
                      disabled={isPast}
                      onClick={() => selectDate(date)}
                      className={`flex flex-col items-center justify-center rounded-xl p-2.5 transition-all text-center cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-white shadow-md ring-2 ring-teal-500/40"
                          : isPast
                            ? "cursor-not-allowed bg-slate-50 text-slate-300 border border-slate-100"
                            : "border border-slate-200 bg-white text-slate-700  hover:bg-gray-100"
                      }`}
                    >
                      <span className="text-[11px] font-medium uppercase tracking-wider opacity-80">
                        {dayOfWeek}
                      </span>
                      <span className="text-base font-bold mt-0.5">
                        {dayNumber}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Choose time window */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                3
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                Choose Time Window
              </h2>
            </div>

            {!selectedDate ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Select a date above to check provider schedule.
              </p>
            ) : availabilityError && !availability ? (
              <ErrorState message={availabilityError} />
            ) : !availability ? (
              <Spinner label="Checking provider availability…" />
            ) : !availability.working ? (
              <EmptyState
                title={`${selectedPerson.name} is not available on this date`}
                message="Please choose another calendar date."
              />
            ) : (
              <div className="space-y-4">
                {/* Working hours banner */}
                <div className="flex items-center justify-between rounded-xl bg-teal-50/70 p-3 text-xs text-teal-900 border border-none">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-900" />
                    <span>
                      Working hours:{" "}
                      <strong className="font-bold">
                        {availability.schedule.startTime} –{" "}
                        {availability.schedule.endTime}
                      </strong>
                    </span>
                  </div>
                  <span className="font-semibold text-teal-700">
                    {(availability.existing || []).length} Bookings on this day
                  </span>
                </div>

                {/* Start & End Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    id="start-time"
                    label="Start Time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  >
                    <option value="">Choose start…</option>
                    {TIME_OPTIONS.filter((t) => {
                      const m = timeToMinutes(t);
                      return (
                        m >= timeToMinutes(availability.schedule.startTime) &&
                        m < timeToMinutes(availability.schedule.endTime)
                      );
                    }).map((t) => (
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
                    <option value="">Choose end…</option>
                    {endTimeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </div>

                {timeError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-none">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{timeError}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Summary & Confirmation Box (1 Column) */}
        <div className="space-y-4">
          <div className="sticky top-28 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
              Booking Summary
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Provider
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedPerson ? selectedPerson.name : "—"}
                </span>
                {selectedPerson && (
                  <span className="block text-slate-500">
                    {selectedPerson.position}
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Date
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedDate ? formatLongDate(selectedDate) : "—"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Time Slot
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  {startTime && endTime ? `${startTime} – ${endTime}` : "—"}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Button
                variant="gradient"
                size="md"
                className="w-full justify-center bg-slate-900"
                onClick={handleConfirm}
                disabled={!canConfirm}
                loading={submitting}
              >
                Confirm Appointment
              </Button>
              <p className="mt-2 text-center text-[11px] text-slate-400">
                You will receive a confirmed pass instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Confirmation({ success, onReset }) {
  const { appointment, person, date } = success;
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-lg animate-in zoom-in-95 duration-200 py-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl">
        {/* Top Header Banner */}
        <div className="bg-teal-600 p-8 text-center text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-lg mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Appointment Booked Successfully!
          </h2>
          <p className="mt-1 text-xs text-teal-100">
            Reference token:{" "}
            <span className="font-mono font-bold text-white">
              {appointment.reference}
            </span>
          </p>
        </div>

        {/* Ticket Details */}
        <div className="p-6 space-y-4 text-xs">
          <div className="flex justify-between border-b border-slate-100 py-2.5">
            <span className="text-slate-500 font-medium">Provider</span>
            <span className="font-bold text-slate-900">{person.name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-2.5">
            <span className="text-slate-500 font-medium">Role / Position</span>
            <span className="text-slate-700">{person.position}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-2.5">
            <span className="text-slate-500 font-medium">Date</span>
            <span className="font-bold text-slate-900">
              {formatLongDate(date)}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-2.5">
            <span className="text-slate-500 font-medium">Time Window</span>
            <span className="font-bold text-teal-700">
              {appointment.startTime} – {appointment.endTime}
            </span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-slate-500 font-medium">Initial Status</span>
            <Badge color="amber" dot size="sm">
              {appointment.status || "Pending Approval"}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 pt-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-center"
              onClick={onReset}
            >
              Book Another
            </Button>
            <Button
              variant="gradient"
              size="sm"
              className="w-full justify-center"
              onClick={() => navigate("/my-bookings")}
            >
              Go to My Bookings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
