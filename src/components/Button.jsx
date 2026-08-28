export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  disabled = false,
  children,
  icon,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const sizeVariants = {
    xs: "px-2.5 py-1 text-xs rounded-lg",
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-xl",
    lg: "px-5 py-2.5 text-base rounded-xl",
    pill: "px-4 py-2 text-sm rounded-full",
  };

  const variants = {
    primary:
      "bg-teal-600 text-white shadow-sm shadow-teal-700/20 hover:bg-teal-500 focus-visible:ring-teal-500",
    gradient:
      "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:ring-indigo-500",
    secondary:
      "bg-white text-slate-700 border border-slate-200/80 shadow-2xs hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus-visible:ring-slate-400",
    dark:
      "bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:ring-slate-700",
    danger:
      "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:text-rose-800 focus-visible:ring-rose-500",
    dangerSolid:
      "bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-500",
    success:
      "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-500",
    ghost:
      "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400",
    accent:
      "bg-indigo-50 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-100 focus-visible:ring-indigo-500",
  };

  const currentSize = sizeVariants[size] || sizeVariants.md;
  const currentVariant = variants[variant] || variants.primary;

  return (
    <button
      className={`${base} ${currentSize} ${currentVariant} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <SpinnerSm /> : icon}
      {children}
    </button>
  );
}

function SpinnerSm() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-current"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

