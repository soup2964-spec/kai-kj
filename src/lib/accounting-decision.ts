import { exportExpenseToAccounting } from "@/lib/accounting-export";
import { normalizeAccountingFields } from "@/lib/accounting-fields";
import type { Expense } from "@/lib/types";

export type AccountingDecision = "approve" | "disapprove";

export async function applyAccountingDecision(
  expense: Expense,
  decision: AccountingDecision,
): Promise<{ expense: Expense; error?: string }> {
  if (decision === "disapprove") {
    return {
      expense: {
        ...expense,
        ...normalizeAccountingFields({
          accountingStatus: "rejected",
          accountingSyncedAt: undefined,
          accountingReference: undefined,
          accountingError: undefined,
        }),
      },
    };
  }

  try {
    const exportResult = await exportExpenseToAccounting(expense);
    return {
      expense: {
        ...expense,
        ...normalizeAccountingFields({
          accountingStatus: "synced",
          accountingSyncedAt: new Date().toISOString(),
          accountingReference: exportResult.referenceId,
          accountingError: undefined,
        }),
      },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not send receipt to accounting software.";

    return {
      expense: {
        ...expense,
        ...normalizeAccountingFields({
          accountingStatus: "failed",
          accountingSyncedAt: undefined,
          accountingReference: undefined,
          accountingError: message,
        }),
      },
      error: message,
    };
  }
}
