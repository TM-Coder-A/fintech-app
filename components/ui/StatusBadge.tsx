type Status =
  | "Successful"
  | "Pending"
  | "Failed"
  | "Reversed";

export default function StatusBadge({
  status,
}: {
  status: Status;
}) {
  const styles: Record<
    Status,
    string
  > = {
    Successful:
      "bg-emerald-50 text-emerald-700",

    Pending:
      "bg-amber-50 text-amber-700",

    Failed:
      "bg-rose-50 text-rose-700",

    Reversed:
      "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}
