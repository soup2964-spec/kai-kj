import {
  expenseNeedsWorkOrder,
  formatWorkOrderLabel,
  isWorkOrderMissing,
} from "@/lib/work-order";
import type { Expense } from "@/lib/types";

export function WorkOrderBadge({
  expense,
  size = "sm",
}: {
  expense: Pick<Expense, "billableStatus" | "workOrderNumber">;
  size?: "sm" | "md";
}) {
  const missing = isWorkOrderMissing(expense);
  const attached = Boolean(expense.workOrderNumber);
  const sizeClass =
    size === "md"
      ? "rounded-md px-2.5 py-1 text-xs"
      : "rounded px-2 py-0.5 text-[11px]";

  if (!expenseNeedsWorkOrder(expense) && !attached) {
    return null;
  }

  if (missing) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold ${sizeClass} border border-[#ca8a04]/40 bg-[#fef9c3] text-[#a16207]`}
        title="Billable receipt missing AppFolio work order number"
      >
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#ca8a04]" />
        WO missing
      </span>
    );
  }

  if (!attached) {
    return null;
  }

  const label = formatWorkOrderLabel(expense.workOrderNumber);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold ${sizeClass} border border-qb-blue/30 bg-qb-blue-light text-qb-blue-dark`}
      title={label}
    >
      <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-qb-blue" />
      {label}
    </span>
  );
}
