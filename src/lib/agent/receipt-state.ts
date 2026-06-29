/**
 * TypeScript mirror of agent/src/kai_agent/state.py
 * Matches agent framework flowchart (Downloads/agent framework.png)
 */

import type { BillableStatus, ExpenseCategory } from "@/lib/types";

export type AgentWorkflowStatus = "ORANGE" | "GREEN";

export interface ReceiptAgentState {
  receipt_image?: string | null;
  receipt_mime_type?: string;
  receipt_filename?: string | null;
  owner_id?: string | null;
  expense_id?: string | null;

  extracted_data?: Record<string, unknown>;
  vendor?: string | null;
  amount?: number | null;
  date?: string | null;
  description?: string | null;
  line_items?: Array<{ name: string; amount: number | null }>;
  category?: ExpenseCategory | string | null;
  category_reason?: string | null;
  confidence?: number | null;
  work_order_on_receipt?: string | null;
  card_last_four?: string | null;
  final_category?: string | null;

  is_billable?: boolean | null;
  billable_status?: BillableStatus | null;
  billable_reason?: string | null;
  matched_rule_id?: string | null;

  work_order_number?: string | null;
  work_order_found?: boolean | null;

  status?: AgentWorkflowStatus | null;
  google_sheet_row_id?: string | null;
  credit_card_tab?: string | null;

  in_research_needed_folder?: boolean;
  research_attempts?: number;
  max_research_attempts?: number;
  contact_maintenance_sent?: boolean;
  maintenance_contact_log?: string[];

  va_scanned?: boolean;
  va_uploaded_to_sheets?: boolean;
  accountant_wo_confirmed?: boolean;
  quickbooks_transaction_id?: string | null;
  credit_card_reconciled?: boolean;
  credit_card_account?: string | null;
  statement_transaction_id?: string | null;

  monthly_folder_path?: string | null;
  receipt_stored?: boolean;

  current_step?: string | null;
  workflow_complete?: boolean;
  notes?: string[];
  vendor_work_order_hints?: string[];

  created_at?: string;
  updated_at?: string;
}

export interface ReceiptAgentResult extends ReceiptAgentState {
  needsReview: boolean;
  exportComplete: boolean;
}

export function parseReceiptAgentResult(
  payload: ReceiptAgentState,
): ReceiptAgentResult {
  const status = payload.status ?? null;
  const complete = payload.workflow_complete === true;

  return {
    ...payload,
    needsReview: status === "ORANGE" || !complete,
    exportComplete:
      complete &&
      Boolean(payload.quickbooks_transaction_id || payload.google_sheet_row_id),
  };
}
