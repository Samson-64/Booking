function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-500">
      <div className="relative flex h-9 w-9 items-center justify-center">
        <div className="absolute h-9 w-9 animate-ping rounded-full bg-teal-400/20" />
        <svg
          className="h-7 w-7 animate-spin text-teal-600"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle
            className="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3.5"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
      <span className="text-xs font-medium text-slate-500">{label}</span>
    </div>
  );
}

export default Spinner;