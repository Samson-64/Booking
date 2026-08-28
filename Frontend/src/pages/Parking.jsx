import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchParkingSpaces } from "../api/booking";
import { apiErrorMessage } from "../api/client";
import Spinner from "../components/Spinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

export default function Parking() {
  const navigate = useNavigate();
  const [floors, setFloors] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchParkingSpaces()
      .then((spaces) => {
        if (!active) return;
        const counts = new Map();
        for (const s of spaces) {
          const floor = s.location || "Unassigned";
          counts.set(floor, (counts.get(floor) || 0) + 1);
        }
        const list = Array.from(counts.entries())
          .map(([floor, count]) => ({ floor, count }))
          .sort((a, b) => a.floor.localeCompare(b.floor));
        setFloors(list);
        setError("");
      })
      .catch((e) => active && setError(apiErrorMessage(e)));
    return () => {
      active = false;
    };
  }, []);

  function openFloor(floor) {
    navigate(`/parking/floor/${encodeURIComponent(floor)}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Parking</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select a floor to see and book its parking slots.
        </p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : floors === null ? (
        <Spinner label="Loading parking floors…" />
      ) : floors.length === 0 ? (
        <EmptyState
          title="No parking floors available"
          message="Check back later."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {floors.map((f) => (
            <button
              key={f.floor}
              onClick={() => openFloor(f.floor)}
              className="group rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">
                  {f.floor}
                </span>
                <span className="text-sm text-gray-400">›</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {f.count} parking slot{f.count !== 1 ? "s" : ""}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
