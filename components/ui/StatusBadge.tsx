interface StatusBadgeProps {
  status: "Successful" | "Pending" | "Failed";
}

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const styles = {
    Successful:
      "bg-emerald-50 text-emerald-700",
    Pending:
      "bg-amber-50 text-amber-700",
    Failed:
      "bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
