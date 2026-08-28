import Badge from "./Badge";

const statusConfig = {
  PENDING: { color: "amber", label: "Pending", dot: true },
  CONFIRMED: { color: "green", label: "Confirmed", dot: true },
  COMPLETED: { color: "blue", label: "Completed", dot: false },
  CANCELLED: { color: "red", label: "Cancelled", dot: true },
  CHECKED_IN: { color: "green", label: "Checked In", dot: true },
};

export function StatusBadge({ status, size = "md", className = "" }) {
  const config = statusConfig[status] || { color: "gray", label: status, dot: false };
  return (
    <Badge color={config.color} dot={config.dot} size={size} className={className}>
      {config.label}
    </Badge>
  );
}

