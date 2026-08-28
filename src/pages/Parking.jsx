import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchParkingSpaces } from "../api/booking";
import { apiErrorMessage } from "../api/client";
import Spinner from "../components/Spinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { CarFront, ChevronRight, ArrowUpRight } from "lucide-react";

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
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Parking Facilities
            </h1>
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 border border-teal-200">
              Multi-Floor
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Select a designated floor to inspect real-time slot occupancy and reserve a space.
          </p>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : floors === null ? (
        <Spinner label="Loading parking facilities and levels…" />
      ) : floors.length === 0 ? (
        <EmptyState
          title="No parking floors available"
          message="No active parking lots found in the directory."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {floors.map((f, idx) => (
            <button
              key={f.floor}
              onClick={() => openFloor(f.floor)}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 text-left shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-teal-400 hover:shadow-md cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                    <CarFront className="h-6 w-6" />
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-teal-50 group-hover:text-teal-600">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Level {idx + 1}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {f.floor}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Dedicated covered parking zone with elevator access
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs font-semibold text-slate-700">
                  {f.count} Total Slot{f.count !== 1 ? "s" : ""}
                </span>
                <span className="text-xs font-semibold text-teal-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  View Spaces <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

