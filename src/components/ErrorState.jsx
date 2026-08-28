import { AlertCircle } from "lucide-react";

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-rose-800">
      <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
      <div className="flex-1 text-sm">
        <p className="font-semibold">{message || "Something went wrong"}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-1 text-xs font-semibold text-rose-700 underline hover:text-rose-900 cursor-pointer"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

