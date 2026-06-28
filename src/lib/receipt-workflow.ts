import { CATEGORY_META } from "@/lib/categories";
import { formatCardLabel } from "@/lib/card-last-four";
import { isWorkOrderMissing } from "@/lib/work-order";
import type {
  Expense,
  ReceiptInboxStatus,
  ReconciliationStatus,
} from "@/lib/types";

export const INBOX_STATUS_LABELS: Record<ReceiptInboxStatus, string> = {
  new: "New",
  needs_review: "Needs review",
  approved: "Approved",
  exported: "Exported",
  reconciled: "Reconciled",
};

export const INBOX_STATUS_ORDER: ReceiptInboxStatus[] = [
  "new",
  "needs_review",
  "approved",
  "exported",
  "reconciled",
];

export const RECONCILIATION_STATUS_LABELS: Record<ReconciliationStatus, string> =
  {
    unmatched: "Unmatched",
    matched: "Matched",
    missing_receipt: "Missing receipt",
    missing_transaction: "Missing transaction",
  };

export type MissingInfoReason =
  | "category"
  | "property"
  | "vendor"
  | "work_order"
  | "card"
  | "receipt_image";

export const MISSING_INFO_LABELS: Record<MissingInfoReason, string> = {
  category: "Missing category",
  property: "Missing property",
  vendor: "Missing vendor",
  work_order: "Missing work order",
  card: "Missing card",
  receipt_image: "Missing receipt image",
};

export function normalizeInboxStatus(
  status: unknown,
  expense?: Pick<Expense, "accountingStatus" | "billableStatus" | "workOrderNumber">,
): ReceiptInboxStatus {
  if (INBOX_STATUS_ORDER.includes(status as ReceiptInboxStatus)) {
    return status as ReceiptInboxStatus;
  }

  if (expense?.accountingStatus === "synced") return "exported";
  if (expense && isWorkOrderMissing(expense)) return "needs_review";
  if (expense?.billableStatus === "review") return "needs_review";
  return "new";
}

export function normalizeReconciliationStatus(
  status: unknown,
): ReconciliationStatus {
  if (
    status === "matched" ||
    status === "missing_receipt" ||
    status === "missing_transaction"
  ) {
    return status;
  }

  return "unmatched";
}

export function normalizeBookkeepingText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getVendorName(expense: Expense): string {
  return expense.vendorName ?? expense.merchant;
}

export function getMissingInfoReasons(expense: Expense): MissingInfoReason[] {
  const reasons: MissingInfoReason[] = [];

  if (!expense.category || expense.category === "other") reasons.push("category");
  if (!expense.propertyName) reasons.push("property");
  if (!getVendorName(expense)) reasons.push("vendor");
  if (isWorkOrderMissing(expense)) reasons.push("work_order");
  if (!expense.cardLastFour) reasons.push("card");
  if (!expense.receiptImage) reasons.push("receipt_image");

  return reasons;
}

function duplicateKey(expense: Expense): string {
  return [
    expense.merchant.trim().toLowerCase(),
    expense.date,
    expense.amount.toFixed(2),
  ].join("|");
}

export function findDuplicateExpenseIds(expenses: Expense[]): Set<string> {
  const firstByKey = new Map<string, string>();
  const duplicates = new Set<string>();

  for (const expense of expenses) {
    const key = duplicateKey(expense);
    const firstId = firstByKey.get(key);
    if (firstId) {
      duplicates.add(expense.id);
      continue;
    }
    firstByKey.set(key, expense.id);
  }

  return duplicates;
}

export function isDuplicateExpense(
  expense: Expense,
  expenses: Expense[],
): boolean {
  if (expense.duplicateOfId) return true;
  return findDuplicateExpenseIds(expenses).has(expense.id);
}

export type ReceiptSearchFilters = {
  query: string;
  inboxStatus: "all" | ReceiptInboxStatus;
  onlyMissingInfo: boolean;
  onlyDuplicates: boolean;
};

export const DEFAULT_RECEIPT_SEARCH_FILTERS: ReceiptSearchFilters = {
  query: "",
  inboxStatus: "all",
  onlyMissingInfo: false,
  onlyDuplicates: false,
};

export function searchExpenses(
  expenses: Expense[],
  filters: ReceiptSearchFilters,
): Expense[] {
  const query = filters.query.trim().toLowerCase();
  const duplicateIds = findDuplicateExpenseIds(expenses);

  return expenses.filter((expense) => {
    if (
      filters.inboxStatus !== "all" &&
      expense.inboxStatus !== filters.inboxStatus
    ) {
      return false;
    }

    if (filters.onlyMissingInfo && getMissingInfoReasons(expense).length === 0) {
      return false;
    }

    if (
      filters.onlyDuplicates &&
      !expense.duplicateOfId &&
      !duplicateIds.has(expense.id)
    ) {
      return false;
    }

    if (!query) return true;

    const haystack = [
      expense.merchant,
      getVendorName(expense),
      expense.amount.toFixed(2),
      expense.date,
      CATEGORY_META[expense.category]?.label ?? expense.category,
      expense.propertyName,
      expense.workOrderNumber,
      formatCardLabel(expense.cardLastFour, expense.cardBrand),
      expense.lineItems.map((item) => item.name).join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export type OperationsMetrics = {
  totalReceipts: number;
  receiptsUploadedToday: number;
  newReceipts: number;
  needsReview: number;
  approved: number;
  exported: number;
  reconciled: number;
  missingWorkOrders: number;
  missingInfo: number;
  duplicateReceipts: number;
  unmatchedTransactions: number;
  reconciliationCompletion: number;
};

export function getOperationsMetrics(expenses: Expense[]): OperationsMetrics {
  const todayKey = new Date().toISOString().slice(0, 10);
  const duplicateIds = findDuplicateExpenseIds(expenses);
  const matched = expenses.filter(
    (expense) => expense.reconciliationStatus === "matched",
  ).length;

  return {
    totalReceipts: expenses.length,
    receiptsUploadedToday: expenses.filter((expense) =>
      expense.createdAt.startsWith(todayKey),
    ).length,
    newReceipts: expenses.filter((expense) => expense.inboxStatus === "new")
      .length,
    needsReview: expenses.filter(
      (expense) => expense.inboxStatus === "needs_review",
    ).length,
    approved: expenses.filter((expense) => expense.inboxStatus === "approved")
      .length,
    exported: expenses.filter((expense) => expense.inboxStatus === "exported")
      .length,
    reconciled: expenses.filter((expense) => expense.inboxStatus === "reconciled")
      .length,
    missingWorkOrders: expenses.filter(isWorkOrderMissing).length,
    missingInfo: expenses.filter(
      (expense) => getMissingInfoReasons(expense).length > 0,
    ).length,
    duplicateReceipts: duplicateIds.size,
    unmatchedTransactions: expenses.filter(
      (expense) => expense.reconciliationStatus !== "matched",
    ).length,
    reconciliationCompletion:
      expenses.length === 0 ? 0 : Math.round((matched / expenses.length) * 100),
  };
}
