import type { Expense } from "@/lib/types";

export function normalizeCreditCardReconcileFields(
  expense: Partial<Expense>,
): Pick<
  Expense,
  "creditCardReconciled" | "statementTransactionId" | "reconciledAt"
> {
  return {
    creditCardReconciled: Boolean(expense.creditCardReconciled),
    statementTransactionId: expense.statementTransactionId ?? undefined,
    reconciledAt: expense.reconciledAt,
  };
}
