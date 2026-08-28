export default function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
      <p className="text-sm font-medium">{message || "Something went wrong"}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-sm font-semibold text-red-600 underline hover:text-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
