import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  createParkingBooking,
  fetchParkingAvailability,
  fetchParkingSpaces,
} from "../api/booking";
import { apiErrorMessage } from "../api/client";
import Card from "../components/Card";
import Button from "../components/Button";
import ErrorState from "../components/ErrorState";
import { Select } from "../components/Fields";
import Badge from "../components/Badge";
import { formatLongDate, todayLocalStr } from "../utils/format";

const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (const m of ["00", "30"]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${m}`);
  }
}

export default function ParkingBooking() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const floor = searchParams.get("floor");
  const [space, setSpace] = useState(null);
  const [spacesLoading, setSpacesLoading] = useState(true);

  const [date, setDate] = useState(searchParams.get("date") || todayLocalStr());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

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
        <Confirmation booking={success} spaceName={space?.name} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          to={floor ? `/parking/floor/${encodeURIComponent(floor)}` : "/parking"}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          {floor ? `← Back to ${floor}` : "← Back to parking"}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          {spacesLoading
            ? "Loading…"
            : space
              ? `Parking Space ${space.name}`
              : "Parking Space"}
        </h1>
        {space?.location && (
          <p className="text-sm text-gray-500">{space.location}</p>
        )}
      </div>

      {error && <ErrorState message={error} />}

      <Card title="Select date and time">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              value={date}
              min={todayLocalStr()}
              onChange={(e) => changeDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Start Time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              {TIME_OPTIONS.map((t) => (
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
              {TIME_OPTIONS.filter((t) => t > startTime).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          {availability?.checking && !checking && (
            <div className="flex items-center gap-2 text-sm">
              <Badge color={availability.occupied ? "red" : "green"}>
                {availability.occupied
                  ? "Selected window is occupied"
                  : "Selected window is free"}
              </Badge>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={checkAvailability}
              disabled={checking}
            >
              {checking ? "Checking…" : "Check availability"}
            </Button>
          </div>
        </div>
      </Card>

      <Button
        variant="primary"
        className="w-full"
        onClick={handleBook}
        disabled={submitting || !space}
      >
        {submitting ? "Booking…" : "Book Parking Space"}
      </Button>
    </div>
  );
}

function Confirmation({ booking, spaceName }) {
  return (
    <Card className="border-green-200 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
        ✓
      </div>
      <h2 className="mt-4 text-xl font-bold text-gray-900">
        Parking Confirmed
      </h2>
      <div className="mt-4 space-y-2 text-left text-sm">
        <Row label="Space" value={spaceName || "Parking space"} />
        <Row label="Date" value={formatLongDate(booking.date)} />
        <Row label="Time" value={`${booking.startTime} – ${booking.endTime}`} />
        <Row label="Booking ID" value={booking.reference} />
      </div>
      <p className="mt-4 text-sm text-gray-500">
        Your booking reference is{" "}
        <span className="font-semibold">{booking.reference}</span>.
      </p>
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
