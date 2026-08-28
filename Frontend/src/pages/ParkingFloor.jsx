import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchParkingSpaces } from "../api/booking";
import { apiErrorMessage } from "../api/client";
import Card from "../components/Card";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";
import { todayLocalStr } from "../utils/format";

export default function ParkingFloor() {
  const { floor } = useParams();
  const navigate = useNavigate();
  const [date, setDate] = useState(todayLocalStr());
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchParkingSpaces(date)
      .then((spaces) => {
        if (active) {
          setSlots(
            spaces.filter((s) => (s.location || "Unassigned") === floor),
          );
          setError("");
        }
      })
      .catch((e) => active && setError(apiErrorMessage(e)));
    return () => {
      active = false;
    };
  }, [date, floor]);

  function changeDate(next) {
    setDate(next);
    setSlots(null);
    setError("");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/parking"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          ← Back to floors
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{floor}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select an available slot on this floor to book.
        </p>
      </div>

      <Card title="Pick a date">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          type="date"
          value={date}
          min={todayLocalStr()}
          onChange={(e) => changeDate(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={() => changeDate(date)} />
      ) : slots === null ? (
        <Spinner label="Loading parking slots…" />
      ) : slots.length === 0 ? (
        <EmptyState
          title={`No slots on ${floor}`}
          message="Try a different floor."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((space) => (
            <div
              key={space.id}
              className={`rounded-xl border bg-white p-5 shadow-sm transition ${
                space.available
                  ? "border-gray-200 hover:shadow-md"
                  : "border-gray-200 opacity-70"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">
                  {space.name}
                </span>
                <Badge color={space.available ? "green" : "red"}>
                  {space.available ? "Available" : "Occupied"}
                </Badge>
              </div>
              {space.location && (
                <p className="mt-1 text-sm text-gray-500">{space.location}</p>
              )}
              <Button
                variant={space.available ? "success" : "secondary"}
                disabled={!space.available}
                className="mt-4 w-full"
                onClick={() =>
                  navigate(
                    `/parking/book/${space.id}?date=${date}&floor=${encodeURIComponent(floor)}`,
                  )
                }
              >
                {space.available ? "Book this space" : "Unavailable"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
