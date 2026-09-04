const colorStyles = {
  gray: "bg-slate-100 text-slate-700 border-slate-200/60",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  red: "bg-rose-50 text-rose-700 border-rose-200/80",
  amber: "bg-amber-50 text-amber-700 border-amber-200/80",
  blue: "bg-sky-50 text-sky-700 border-sky-200/80",
  teal: "bg-teal-50 text-teal-700 border-teal-200/80",
  purple: "bg-purple-50 text-purple-700 border-purple-200/80",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
};

const dotColors = {
  gray: "bg-slate-400",
  green: "bg-emerald-500",
  red: "bg-rose-500",
  amber: "bg-amber-500",
  blue: "bg-sky-500",
  teal: "bg-teal-500",
  purple: "bg-purple-500",
  indigo: "bg-indigo-500",
};

function Badge({
  color = "gray",
  dot = false,
  size = "md",
  children,
  className = "",
}) {
  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border shadow-2xs whitespace-nowrap transition-colors ${colorStyles[color] || colorStyles.gray} ${sizeClasses} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotColors[color] || dotColors.gray}`}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
