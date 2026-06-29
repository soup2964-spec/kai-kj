import type { ReceiptAgentState } from "@/lib/agent/receipt-state";
import type { Expense } from "@/lib/types";
import { getMissingInfoReasons, INBOX_STATUS_LABELS } from "@/lib/receipt-workflow";
import { emitLiveFeedEvent } from "./store";

export function describeAgentStep(state: ReceiptAgentState): string[] {
  const steps: string[] = [];

  if (state.current_step) {
    steps.push(formatAgentStepLabel(state.current_step));
  }

  if (state.va_scanned) {
    steps.push("Receipt scanned by agent");
  }

  if (state.va_uploaded_to_sheets || state.google_sheet_row_id) {
    steps.push("Uploaded to Google Sheets");
  }

  if (state.work_order_found && state.work_order_number) {
    steps.push(`Work order ${state.work_order_number} matched`);
  } else if (state.status === "ORANGE") {
    steps.push("Flagged for review — work order or info missing");
  }

  if (state.contact_maintenance_sent) {
    steps.push("Maintenance contact notified");
  }

  if (state.credit_card_reconciled || state.statement_transaction_id) {
    steps.push("Matched to credit card statement");
  }

  if (state.quickbooks_transaction_id) {
    steps.push("Synced to QuickBooks");
  }

  if (state.workflow_complete) {
    steps.push(
      state.status === "GREEN"
        ? "Agent workflow complete"
        : "Agent workflow paused for review",
    );
  }

  for (const note of state.notes ?? []) {
    if (typeof note === "string" && note.trim()) {
      steps.push(note.trim());
    }
  }

  return [...new Set(steps)];
}

export function emitAgentActivity(
  jobId: string,
  agentState: ReceiptAgentState,
  expenseId?: string,
) {
  emitLiveFeedEvent({
    kind: "agent_started",
    message: "Agent pipeline started",
    jobId,
    expenseId,
  });

  for (const step of describeAgentStep(agentState)) {
    emitLiveFeedEvent({
      kind: "agent_step",
      message: step,
      jobId,
      expenseId,
      meta: {
        agentStatus: agentState.status ?? null,
        workflowComplete: agentState.workflow_complete ?? false,
      },
    });
  }

  emitLiveFeedEvent({
    kind: "agent_complete",
    message:
      agentState.status === "GREEN" && agentState.workflow_complete
        ? "Agent finished — receipt ready"
        : "Agent finished — needs review",
    jobId,
    expenseId,
    meta: {
      agentStatus: agentState.status ?? null,
      workflowComplete: agentState.workflow_complete ?? false,
    },
  });
}

export function getPendingPipelineExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((expense) => isExpenseInPipeline(expense));
}

export function isExpenseInPipeline(expense: Expense): boolean {
  if (expense.inboxStatus === "new" || expense.inboxStatus === "needs_review") {
    return true;
  }

  if (expense.accountingStatus === "pending" || expense.accountingStatus === "failed") {
    return true;
  }

  if (
    expense.reconciliationStatus === "unmatched" ||
    expense.reconciliationStatus === "missing_receipt"
  ) {
    return true;
  }

  return false;
}

export function describePipelineExpense(expense: Expense): string {
  if (expense.inboxStatus === "needs_review") {
    const missing = getMissingInfoReasons(expense);
    if (missing.length > 0) {
      return `Needs review — ${missing.length} missing field${missing.length === 1 ? "" : "s"}`;
    }
    return INBOX_STATUS_LABELS.needs_review;
  }

  if (expense.accountingStatus === "pending") {
    return "Awaiting accounting sync";
  }

  if (expense.accountingStatus === "failed") {
    return "Accounting sync failed";
  }

  if (expense.reconciliationStatus === "unmatched") {
    return "Unmatched to statement";
  }

  if (expense.reconciliationStatus === "missing_receipt") {
    return "Missing receipt for statement line";
  }

  return INBOX_STATUS_LABELS[expense.inboxStatus] ?? "In pipeline";
}

function formatAgentStepLabel(step: string): string {
  return step
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatFeedTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
