import type { ReceiptAgentState } from "@/lib/agent/receipt-state";
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
    workOrderNumber: state.work_order_number ?? undefined,
    billableStatus,
    billableReason: state.billable_reason ?? "",
    billableSource: state.matched_rule_id ? "rule" : "default",
    matchedRuleId: state.matched_rule_id ?? undefined,
    accountingStatus,
    accountingSyncedAt:
      accountingStatus === "synced" ? new Date().toISOString() : undefined,
    accountingReference: state.quickbooks_transaction_id ?? undefined,
    creditCardReconciled: Boolean(state.credit_card_reconciled || state.statement_transaction_id),
    statementTransactionId: state.statement_transaction_id ?? undefined,
    reconciledAt:
      state.credit_card_reconciled || state.statement_transaction_id
        ? new Date().toISOString()
        : undefined,
    receiptImage: options?.receiptImage,
    createdAt: state.created_at ?? new Date().toISOString(),
  };
}
