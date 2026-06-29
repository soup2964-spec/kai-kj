import { mapAgentStateToExpense } from "@/lib/agent/map-state-to-expense";
import type { ReceiptAgentState } from "@/lib/agent/receipt-state";
import type { Expense, ScannedReceipt } from "@/lib/types";

export interface MergeScanWithAgentOptions {
  expenseId?: string;
  receiptImage?: string;
}

/**
 * Combine KIE scan output with agent workflow fields (Sheets, WO, reconcile, etc.).
 * Extraction fields from the scan remain the source of truth.
 */
export function mergeScanWithAgent(
  scan: ScannedReceipt,
  agentState: ReceiptAgentState,
  options: MergeScanWithAgentOptions = {},
): Expense {
  const agentExpense = mapAgentStateToExpense(agentState, {
    receiptImage: options.receiptImage,
  });

  return {
    ...agentExpense,
    merchant: scan.merchant,
    amount: scan.amount,
    date: scan.date,
    category: scan.category,
    categoryReason: scan.categoryReason,
    lineItems: scan.lineItems,
    confidence: scan.confidence,
    cardLastFour: scan.cardLastFour ?? agentExpense.cardLastFour,
    cardBrand: scan.cardBrand ?? agentExpense.cardBrand,
    vendorName: scan.vendorName ?? agentExpense.vendorName,
    propertyName: scan.propertyName ?? agentExpense.propertyName,
    workOrderNumber: agentExpense.workOrderNumber ?? scan.workOrderNumber ?? undefined,
    billableStatus: agentExpense.billableStatus ?? scan.billableStatus,
    billableReason: agentExpense.billableReason || scan.billableReason,
    billableSource: agentExpense.billableSource ?? scan.billableSource,
    matchedRuleId: agentExpense.matchedRuleId ?? scan.matchedRuleId,
    id: options.expenseId ?? agentExpense.id,
    receiptImage: options.receiptImage ?? agentExpense.receiptImage,
    createdAt: agentExpense.createdAt ?? new Date().toISOString(),
  };
}
