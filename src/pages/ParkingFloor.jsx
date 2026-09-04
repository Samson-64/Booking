import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchParkingSpaces } from "../api/booking";
import { apiErrorMessage } from "../api/client";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";
import { todayLocalStr } from "../utils/format";
import { CarFront, Calendar, ArrowLeft } from "lucide-react";

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

  const availableCount = useMemo(
    () => (slots || []).filter((s) => s.available).length,
    [slots],
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Back and Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <button
            onClick={() => navigate("/parking")}
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Floors
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {floor}
            </h1>
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 border border-teal-200">
              {availableCount} Available Today
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Pick a date and choose an available parking bay to reserve.
          </p>
        </div>

        {/* Date Selector Pill */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs">
          <Calendar className="h-4 w-4 text-teal-600 ml-2" />
          <span className="text-xs font-semibold text-slate-700">Date:</span>
          <input
            type="date"
            value={date}
            min={todayLocalStr()}
            onChange={(e) => changeDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => changeDate(date)} />
      ) : slots === null ? (
        <Spinner label={`Loading slots on ${floor}…`} />
      ) : slots.length === 0 ? (
        <EmptyState
          title={`No spaces listed on ${floor}`}
          message="Try selecting another floor or date."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((space) => {
            const isAvail = space.available;
            return (
              <div
                key={space.id}
                className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                  isAvail
                    ? "border-slate-200/80 bg-white shadow-2xs hover:-translate-y-1 hover:border-teal-400 hover:shadow-md"
                    : "border-slate-200/60 bg-slate-50/70 opacity-75"
                }`}
              >
                <div>
                  {/* Slot Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-2xs ${
                          isAvail ? "bg-teal-600" : "bg-slate-400"
                        }`}
                      >
                        <CarFront className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {space.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {space.location}
                        </p>
                      </div>
                    </div>
                    <Badge color={isAvail ? "emerald" : "rose"} dot size="sm">
                      {isAvail ? "Available" : "Occupied"}
                    </Badge>
                  </div>
                </div>

                {/* Slot Action */}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <Button
                    variant={isAvail ? "gradient" : "secondary"}
                    disabled={!isAvail}
                    className="w-full justify-center"
                    onClick={() =>
                      navigate(
                        `/parking/book/${space.id}?date=${date}&floor=${encodeURIComponent(floor)}`,
                      )
                    }
                  >
                    {isAvail ? "Book Space" : "Unavailable"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
