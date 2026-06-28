import { normalizeBillableFields } from "@/lib/billable-engine";
import { normalizeAccountingFields } from "@/lib/accounting-fields";
import { normalizeCardBrand, normalizeCardLastFour } from "@/lib/card-last-four";
import { normalizeWorkOrderNumber } from "@/lib/work-order";
import { normalizeLineItems } from "@/lib/receipt-line-items";
import {
  normalizeBookkeepingText,
  normalizeInboxStatus,
  normalizeReconciliationStatus,
} from "@/lib/receipt-workflow";
import {
  EXPENSE_CATEGORIES,
  type AccountingSyncStatus,
  type BillableSource,
  type BillableStatus,
  type Expense,
  type ExpenseCategory,
} from "@/lib/types";

export function parseOwnerId(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("A valid ownerId is required.");
  }

  return value.trim();
}

export function parseExpensePayload(value: unknown): Expense {
  if (!value || typeof value !== "object") {
    throw new Error("Expense payload is required.");
  }

  const input = value as Record<string, unknown>;
  const category = input.category;

  if (
    typeof input.id !== "string" ||
    typeof input.merchant !== "string" ||
    typeof input.amount !== "number" ||
    typeof input.date !== "string" ||
    typeof category !== "string" ||
    !EXPENSE_CATEGORIES.includes(category as ExpenseCategory) ||
    typeof input.categoryReason !== "string" ||
    typeof input.confidence !== "number" ||
    typeof input.createdAt !== "string" ||
    typeof input.billableStatus !== "string" ||
    typeof input.billableReason !== "string" ||
    typeof input.billableSource !== "string"
  ) {
    throw new Error("Expense payload is missing required fields.");
  }

  const billableStatus = input.billableStatus as BillableStatus;
  const billableSource = input.billableSource as BillableSource;

  if (
    !["billable", "non_billable", "review"].includes(billableStatus) ||
    !["rule", "default", "manual"].includes(billableSource)
  ) {
    throw new Error("Expense payload has invalid billable fields.");
  }

  const expense: Expense = {
    id: input.id,
    merchant: input.merchant,
    amount: input.amount,
    date: input.date,
    category: category as ExpenseCategory,
    categoryReason: input.categoryReason,
    lineItems: normalizeLineItems(
      (input.lineItems as Expense["lineItems"] | undefined) ?? [],
    ),
    confidence: input.confidence,
    cardLastFour: normalizeCardLastFour(input.cardLastFour),
    cardBrand: normalizeCardBrand(input.cardBrand),
    workOrderNumber: normalizeWorkOrderNumber(input.workOrderNumber),
    createdAt: input.createdAt,
    inboxStatus: normalizeInboxStatus(input.inboxStatus),
    reconciliationStatus: normalizeReconciliationStatus(
      input.reconciliationStatus,
    ),
    propertyName: normalizeBookkeepingText(input.propertyName),
    vendorName: normalizeBookkeepingText(input.vendorName),
    duplicateOfId: normalizeBookkeepingText(input.duplicateOfId),
    ...normalizeBillableFields({
      billableStatus,
      billableReason: input.billableReason,
      billableSource,
      matchedRuleId:
        typeof input.matchedRuleId === "string"
          ? input.matchedRuleId
          : undefined,
    }),
    ...normalizeAccountingFields({
      accountingStatus:
        typeof input.accountingStatus === "string"
          ? (input.accountingStatus as AccountingSyncStatus)
          : undefined,
      accountingSyncedAt:
        typeof input.accountingSyncedAt === "string"
          ? input.accountingSyncedAt
          : undefined,
      accountingReference:
        typeof input.accountingReference === "string"
          ? input.accountingReference
          : undefined,
      accountingError:
        typeof input.accountingError === "string"
          ? input.accountingError
          : undefined,
    }),
  };

  return expense;
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
