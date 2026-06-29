import type { Expense } from "@/lib/types";

export function ReconcileBadge({
  expense,
  size = "sm",
}: {
  expense: Pick<Expense, "creditCardReconciled">;
  size?: "sm" | "md";
}) {
  if (!expense.creditCardReconciled) return null;

  return (
    <span
      className={`inline-flex items-center rounded border font-semibold border-emerald-200 bg-emerald-50 text-emerald-800 ${
        size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]"
      }`}
    >
      Reconciled
    </span>
  );
}
