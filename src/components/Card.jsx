function Card({
  title,
  subtitle,
  children,
  className = "",
  actions,
  badge,
  noPadding = false,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-2xs transition-all ${
        onClick ? "cursor-pointer hover:border-teal-300 hover:shadow-md" : ""
      } ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                {badge}
              </div>
              {subtitle && (
                <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "p-6"}>{children}</div>
    </div>
  );
}

export default Card;