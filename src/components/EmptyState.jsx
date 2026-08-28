import { Inbox } from "lucide-react";

function EmptyState({
  title = "No items found",
  message = "Try adjusting your filters or create a new entry.",
  icon = <Inbox className="h-8 w-8 text-slate-400" />,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-2xs border border-slate-100 mb-3 text-slate-400">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {message && (
        <p className="mt-1 max-w-sm text-xs text-slate-500">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;