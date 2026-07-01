import type { CcLedgerRowInput, CcLedgerSheetStatus } from "@/lib/cc-ledger-types";
import { randomUUID } from "crypto";
import { CATEGORY_META } from "@/lib/categories";
import { normalizeCardLastFour } from "@/lib/card-last-four";
import { normalizeWorkOrderNumber } from "@/lib/work-order";
import type { CcLedgerFieldKey } from "@/lib/sheets-layout";
import type {
  BillableStatus,
  Expense,
  ExpenseCategory,
} from "@/lib/types";

const EXPENSE_CATEGORIES = new Set<string>([
  "groceries",
  "dining",
  "transportation",
  "shopping",
  "entertainment",
  "health",
  "utilities",
  "travel",
  "business",
  "months",
  "credit_cards",
  "other",
]);

function parseBillableStatus(value: string): BillableStatus {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("non")) return "non_billable";
  if (normalized.includes("billable")) return "billable";
  if (normalized.includes("review")) return "review";
  return "review";
}

function parseCategory(value: string): ExpenseCategory {
  const normalized = value.trim().toLowerCase();
  if (EXPENSE_CATEGORIES.has(normalized)) {
    return normalized as ExpenseCategory;
  }

  for (const [key, meta] of Object.entries(CATEGORY_META)) {
    if (meta.label.toLowerCase() === normalized) {
      return key as ExpenseCategory;
    }
  }

  return "other";
}

function parseSheetStatus(value: string | undefined): CcLedgerSheetStatus {
  const normalized = value?.trim().toUpperCase();
  if (normalized === "ORANGE" || normalized === "GREEN") return normalized;
  return "";
}

function parseAmount(value: string | undefined): number {
  if (!value?.trim()) return 0;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseReconciled(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "yes" || normalized === "true" || normalized === "y";
}

export function expenseToCcLedgerRow(
  expense: Expense,
  sheetStatus: CcLedgerSheetStatus = "",
): CcLedgerRowInput {
  return {
    date: expense.date,
    merchant: expense.merchant,
    amount: expense.amount,
    category: expense.category,
    billableStatus: expense.billableStatus,
    billableReason: expense.billableReason,
    workOrderNumber: expense.workOrderNumber,
    cardLastFour: expense.cardLastFour,
    sheetStatus,
    reconciled: expense.creditCardReconciled ?? false,
    expenseId: expense.id,
  };
}

export function ccLedgerRowToExpense(
  row: Partial<Record<CcLedgerFieldKey, string>>,
  options?: { rowNumber?: number; tab?: string },
): Expense {
  const expenseId = row.expenseId?.trim() || randomUUID();
  const merchant = row.merchant?.trim() || "Unknown";
  const amount = parseAmount(row.amount);
  const date = row.date?.trim() || new Date().toISOString().slice(0, 10);
  const category = parseCategory(row.category ?? "other");
  const billableStatus = parseBillableStatus(row.billableStatus ?? "review");
  const sheetStatus = parseSheetStatus(row.sheetStatus);

  return {
    id: expenseId,
    merchant,
    amount,
    date,
    category,
    categoryReason: "Imported from Google Sheets",
    lineItems: [],
    confidence: 1,
    cardLastFour: normalizeCardLastFour(row.card?.replace(/\D/g, "").slice(-4)),
    workOrderNumber: normalizeWorkOrderNumber(row.workOrder),
    billableStatus,
    billableReason: row.billableReason?.trim() || "Imported from Google Sheets",
    billableSource: "manual",
    accountingStatus: "pending",
    inboxStatus:
      sheetStatus === "GREEN"
        ? "reconciled"
        : sheetStatus === "ORANGE"
          ? "needs_review"
          : "new",
    reconciliationStatus: parseReconciled(row.reconciled) ? "matched" : "unmatched",
    creditCardReconciled: parseReconciled(row.reconciled),
    createdAt: new Date().toISOString(),
    vendorName: merchant,
  };
}
