import type { ReceiptAgentState } from "@/lib/agent/receipt-state";
import {
  normalizeInboxStatus,
  normalizeReconciliationStatus,
} from "@/lib/receipt-workflow";
import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory } from "@/lib/types";

function isExpenseCategory(value: string | null | undefined): value is ExpenseCategory {
  return Boolean(value && (EXPENSE_CATEGORIES as readonly string[]).includes(value));
}

/**
 * Map LangGraph ReceiptState → Kai KJ Expense for Supabase / localStorage.
 */
export function mapAgentStateToExpense(
  state: ReceiptAgentState,
  options?: { receiptImage?: string },
): Expense {
  const id = state.expense_id ?? crypto.randomUUID();
  const rawCategory = state.final_category ?? state.category;
  const category: ExpenseCategory = isExpenseCategory(rawCategory)
    ? rawCategory
    : "other";

  const billableStatus =
    state.billable_status ??
    (state.is_billable === true
      ? "billable"
      : state.is_billable === false
        ? "non_billable"
        : "review");

  const accountingStatus =
    state.workflow_complete && state.quickbooks_transaction_id
      ? "synced"
      : state.status === "ORANGE" || !state.workflow_complete
        ? "pending"
        : "pending";

  const creditCardReconciled = Boolean(
    state.credit_card_reconciled || state.statement_transaction_id,
  );
  const workOrderNumber = state.work_order_number ?? undefined;
  const inboxStatus = normalizeInboxStatus(
    creditCardReconciled
      ? "reconciled"
      : state.status === "ORANGE"
        ? "needs_review"
        : accountingStatus === "synced"
          ? "exported"
          : undefined,
    { accountingStatus, billableStatus, workOrderNumber },
  );
  const reconciliationStatus = normalizeReconciliationStatus(
    creditCardReconciled ? "matched" : undefined,
  );

  return {
    id,
    merchant: state.vendor ?? "Unknown",
    amount: state.amount ?? 0,
    date: state.date ?? new Date().toISOString().slice(0, 10),
    category,
    categoryReason: state.category_reason ?? state.description ?? "",
    lineItems: (state.line_items ?? []).map((item) => ({
      name: item.name,
      amount: item.amount,
    })),
    confidence: state.confidence ?? 0.5,
    cardLastFour: state.card_last_four ?? undefined,
    workOrderNumber,
    billableStatus,
    billableReason: state.billable_reason ?? "",
    billableSource: state.matched_rule_id ? "rule" : "default",
    matchedRuleId: state.matched_rule_id ?? undefined,
    accountingStatus,
    accountingSyncedAt:
      accountingStatus === "synced" ? new Date().toISOString() : undefined,
    accountingReference: state.quickbooks_transaction_id ?? undefined,
    creditCardReconciled,
    statementTransactionId: state.statement_transaction_id ?? undefined,
    reconciledAt: creditCardReconciled ? new Date().toISOString() : undefined,
    inboxStatus,
    reconciliationStatus,
    receiptImage: options?.receiptImage,
    createdAt: state.created_at ?? new Date().toISOString(),
  };
}
