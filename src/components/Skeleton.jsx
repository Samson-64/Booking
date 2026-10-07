export default function Skeleton({ className = "", ...props }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`}
      {...props}
    />
  );
}