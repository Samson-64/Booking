import Badge from "./Badge";

const statusColor = {
  PENDING: "amber",
  CONFIRMED: "green",
  COMPLETED: "blue",
  CANCELLED: "red",
};

export function StatusBadge({ status }) {
  return <Badge color={statusColor[status] || "gray"}>{status}</Badge>;
}
