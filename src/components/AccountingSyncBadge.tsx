import {
  ACCOUNTING_STATUS_META,
  canReviewAccounting,
} from "@/lib/accounting-fields";
import type { Expense } from "@/lib/types";

export function AccountingSyncBadge({
  status,
  size = "sm",
}: {
  status: Expense["accountingStatus"];
  size?: "sm" | "md";
}) {
  const meta = ACCOUNTING_STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center rounded border font-semibold ${meta.className} ${
        size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]"
      }`}
    >
      {meta.label}
    </span>
  );
}

export function canSubmitAccountingReview(status: Expense["accountingStatus"]) {
  return canReviewAccounting(status);
}
