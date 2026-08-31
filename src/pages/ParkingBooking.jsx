import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  createParkingBooking,
  fetchParkingAvailability,
  fetchParkingSpaces,
} from "../api/booking";
import { apiErrorMessage } from "../api/client";
import Button from "../components/Button";
import ErrorState from "../components/ErrorState";
import { Select } from "../components/Fields";
import Badge from "../components/Badge";
import { formatLongDate, todayLocalStr } from "../utils/format";
import {
  CarFront,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

function allTimeOptions() {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (const m of ["00", "30"]) {
      opts.push(`${String(h).padStart(2, "0")}:${m}`);
    }
  }
  return opts;
}

function timeOptionsForDate(selectedDate) {
  const all = allTimeOptions();
  if (selectedDate !== todayLocalStr()) return all;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const rounded = Math.ceil(currentMinutes / 30) * 30;
  const minTime = `${String(Math.floor(rounded / 60)).padStart(2, "0")}:${String(rounded % 60).padStart(2, "0")}`;
  return all.filter((t) => t >= minTime);
}

export default function ParkingBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const floor = searchParams.get("floor");
  const [space, setSpace] = useState(null);
  const [spacesLoading, setSpacesLoading] = useState(true);

  const [date, setDate] = useState(searchParams.get("date") || todayLocalStr());
  const initialOpts = timeOptionsForDate(searchParams.get("date") || todayLocalStr());
  const [startTime, setStartTime] = useState(initialOpts[0] || "09:00");
  const [endTime, setEndTime] = useState(initialOpts[1] || allTimeOptions()[allTimeOptions().indexOf(initialOpts[0]) + 1] || "10:00");

  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  // Load the space details via the spaces list for this date.
  useEffect(() => {
    let active = true;
    fetchParkingSpaces(date)
      .then((list) => {
        const found = list.find((s) => s.id === id);
        if (active) {
          setSpace(found || null);
          setSpacesLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(apiErrorMessage({ message: "Could not load space" }));
          setSpacesLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id, date]);

  function changeDate(next) {
    setDate(next);
    setSpace(null);
    setSpacesLoading(true);
    setAvailability(null);
    setError("");
    const opts = timeOptionsForDate(next);
    setStartTime(opts[0] || "09:00");
    const nextIdx = allTimeOptions().indexOf(opts[0]) + 1;
    setEndTime(allTimeOptions()[nextIdx] || opts[0] || "10:00");
  }

  async function checkAvailability() {
    setChecking(true);
    setError("");
    try {
      const data = await fetchParkingAvailability(id, date);
      const occupied = data.bookings.some(
        (b) => startTime < b.endTime && endTime > b.startTime,
      );
      setAvailability({ checking: true, occupied });
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setChecking(false);
    }
  }

  async function handleBook() {
    setSubmitting(true);
    setError("");
    try {
      const booking = await createParkingBooking({
        parkingSpaceId: id,
        date,
        startTime,
        endTime,
      });
      setSuccess(booking);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg">
        <Confirmation
          booking={success}
          spaceName={space?.name}
          floor={floor}
          onReset={() => setSuccess(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <button
          onClick={() =>
            navigate(
              floor
                ? `/parking/floor/${encodeURIComponent(floor)}`
                : "/parking",
            )
          }
          className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors mb-2 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {floor ? `Back to ${floor}` : "Back to parking"}
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
            <CarFront className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {spacesLoading
                ? "Loading space…"
                : space
                ? `Reserve Space ${space.name}`
                : "Parking Space"}
            </h1>
            <p className="text-xs text-slate-500">
              {space?.location || floor || "Facility Zone"} · Reserved client parking
            </p>
          </div>
        </div>
      </div>

      {error && <ErrorState message={error} />}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Main form (2 cols) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs md:col-span-2 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
            Schedule Time Window
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Reservation Date
              </label>
              <input
                type="date"
                value={date}
                min={todayLocalStr()}
                onChange={(e) => changeDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-3 focus:ring-teal-500/15"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Start Time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                {timeOptionsForDate(date).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              <Select
                label="End Time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              >
                {allTimeOptions().filter((t) => t > startTime).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>

            {/* Check availability action */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={checkAvailability}
                  loading={checking}
                >
                  Verify Slot Open
                </Button>

                {availability?.checking && !checking && (
                  <Badge
                    color={availability.occupied ? "rose" : "emerald"}
                    dot
                    size="sm"
                  >
                    {availability.occupied
                      ? "Window Occupied"
                      : "Window Available"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary side box (1 col) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
              Summary
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Bay
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  {space ? space.name : "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Location
                </span>
                <span className="font-medium text-slate-700">
                  {space?.location || floor || "Facility Zone"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Time Slot
                </span>
                <span className="font-bold text-slate-800">
                  {startTime} – {endTime}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Date
                </span>
                <span className="font-medium text-slate-700">
                  {formatLongDate(date)}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="gradient"
            size="md"
            className="w-full justify-center"
            onClick={handleBook}
            disabled={submitting || !space}
            loading={submitting}
          >
            Confirm Reservation
          </Button>
        </div>
      </div>
    </div>
  );
}

function Confirmation({ booking, spaceName, floor, onReset }) {
  const navigate = useNavigate();

  return (
    <div className="animate-in zoom-in-95 duration-200 py-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl">
        {/* Header */}
        <div className="bg-teal-600 p-8 text-center text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-lg mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Parking Space Reserved!
          </h2>
          <p className="mt-1 text-xs text-teal-100">
            Booking Pass: <span className="font-mono font-bold text-white">{booking.reference}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="flex justify-between border-b border-slate-100 py-2.5">
            <span className="text-slate-500 font-medium">Space Name</span>
            <span className="font-bold text-slate-900">{spaceName || "Parking Space"}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-2.5">
            <span className="text-slate-500 font-medium">Floor / Level</span>
            <span className="text-slate-700">{floor || "Assigned Level"}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-2.5">
            <span className="text-slate-500 font-medium">Date</span>
            <span className="font-bold text-slate-900">{formatLongDate(booking.date)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-2.5">
            <span className="text-slate-500 font-medium">Reserved Hours</span>
            <span className="font-bold text-teal-700">
              {booking.startTime} – {booking.endTime}
            </span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-slate-500 font-medium">Status</span>
            <Badge color="emerald" dot size="sm">
              Confirmed
            </Badge>
          </div>

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
              View My Bookings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

