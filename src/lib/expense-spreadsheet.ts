import { CATEGORY_META } from "@/lib/categories";
import { formatCardLabel } from "@/lib/card-last-four";
import { formatWorkOrderLabel } from "@/lib/work-order";
import { ACCOUNTING_STATUS_META } from "@/lib/accounting-fields";
import {
  getMissingInfoReasons,
  getVendorName,
  INBOX_STATUS_LABELS,
  MISSING_INFO_LABELS,
  RECONCILIATION_STATUS_LABELS,
} from "@/lib/receipt-workflow";
import type { Expense } from "@/lib/types";

export const EXPENSE_SHEET_HEADERS = [
  "Date",
  "Merchant",
  "Vendor",
  "Amount",
  "Category",
  "Category Reason",
  "Billable Status",
  "Billable Reason",
  "Work Order",
  "Property",
  "Card",
  "Inbox Status",
  "Accounting Status",
  "Reconciliation Status",
  "Missing Info",
  "Duplicate Of",
  "Line Items",
  "Confidence",
  "Scanned At",
] as const;

function formatLineItems(expense: Expense): string {
  if (expense.lineItems.length === 0) return "";

  return expense.lineItems
    .map((item) => {
      if (item.amount == null) return item.name;
      return `${item.name} ($${item.amount.toFixed(2)})`;
    })
    .join("; ");
}

function formatBillableStatus(status: Expense["billableStatus"]): string {
  switch (status) {
    case "billable":
      return "Billable";
    case "non_billable":
      return "Non-billable";
    case "review":
      return "Needs review";
  }
}

export function expenseToSheetRow(expense: Expense): string[] {
  return [
    expense.date,
    expense.merchant,
    getVendorName(expense),
    expense.amount.toFixed(2),
    CATEGORY_META[expense.category]?.label ?? expense.category,
    expense.categoryReason,
    formatBillableStatus(expense.billableStatus),
    expense.billableReason,
    formatWorkOrderLabel(expense.workOrderNumber),
    expense.propertyName ?? "",
    formatCardLabel(expense.cardLastFour),
    INBOX_STATUS_LABELS[expense.inboxStatus],
    ACCOUNTING_STATUS_META[expense.accountingStatus].label,
    RECONCILIATION_STATUS_LABELS[expense.reconciliationStatus],
    getMissingInfoReasons(expense)
      .map((reason) => MISSING_INFO_LABELS[reason])
      .join("; "),
    expense.duplicateOfId ?? "",
    formatLineItems(expense),
    expense.confidence.toFixed(2),
    expense.createdAt,
  ];
}

export function expensesToSheetRows(expenses: Expense[]): string[][] {
  return [Array.from(EXPENSE_SHEET_HEADERS), ...expenses.map(expenseToSheetRow)];
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function expensesToCsv(expenses: Expense[]): string {
  return expensesToSheetRows(expenses)
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
}

export function downloadExpensesCsv(expenses: Expense[]): void {
  const csv = expensesToCsv(expenses);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);

  anchor.href = url;
  anchor.download = `kai-kj-expenses-${stamp}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
