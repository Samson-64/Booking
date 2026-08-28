import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchParkingSpaces } from "../api/booking";
import { apiErrorMessage } from "../api/client";
import Card from "../components/Card";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";
import { Select } from "../components/Fields";
import { todayLocalStr } from "../utils/format";

export default function Parking() {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayLocalStr());
  const [level, setLevel] = useState("ALL");
  const [spaces, setSpaces] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchParkingSpaces(date)
      .then((s) => {
        if (active) {
          setSpaces(s);
          setError("");
        }
      })
      .catch((e) => active && setError(apiErrorMessage(e)));
    return () => {
      active = false;
    };
  }, [date]);

  function changeDate(next) {
    setDate(next);
    setSpaces(null);
    setError("");
  }

  const levels = spaces ? ["ALL", ...new Set(spaces.map((s) => s.level))] : [];
  const visibleSpaces = spaces
    ? (level === "ALL" ? spaces : spaces.filter((s) => s.level === level))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Parking</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose an available parking space to book.
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

      {spaces && spaces.length > 0 && (
        <Card title="Select a level">
          <Select
            label="Level / Floor"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            {levels.map((lv) => (
              <option key={lv} value={lv}>
                {lv === "ALL" ? "All levels" : lv}
              </option>
            ))}
          </Select>
        </Card>
      )}

      {error ? (
        <ErrorState message={error} onRetry={() => changeDate(date)} />
      ) : spaces === null ? (
        <Spinner label="Loading parking spaces…" />
      ) : spaces.length === 0 ? (
        <EmptyState
          title="No parking spaces available"
          message="Check back later."
        />
      ) : visibleSpaces.length === 0 ? (
        <EmptyState
          title="No spaces on this level"
          message="Try a different level."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSpaces.map((space) => (
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
                  navigate(`/parking/book/${space.id}?date=${date}`)
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
