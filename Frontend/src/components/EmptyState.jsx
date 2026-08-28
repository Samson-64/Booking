import { Mailbox } from "lucide-react";

function EmptyState({ title, message, icon = <Mailbox className="h-10 w-10" /> }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-3 text-base font-semibold text-gray-900">{title}</h3>
      {message && (
        <p className="mt-1 max-w-sm text-sm text-gray-500">{message}</p>
      )}
    </div>
  );
}

export default EmptyState;
