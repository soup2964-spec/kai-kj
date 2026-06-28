import type { Expense } from "@/lib/types";
import type { StatementTransaction } from "@/lib/statement-types";
import {
  applyReconcileMatchToExpense,
  reconcileExpensesAgainstStatements,
  type ReconcileMatch,
  type ReconcileSummary,
} from "@/lib/statement-reconcile";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchExpensesForOwner,
  updateExpenseReconcileForOwner,
} from "@/lib/supabase/expenses";
import {
  fetchStatementTransactionsForOwner,
  markStatementTransactionMatched,
} from "@/lib/supabase/statements";

export interface ReconcileRunInput {
  ownerId: string;
  expenseIds?: string[];
  expenses?: Expense[];
  transactions?: StatementTransaction[];
}

export interface ReconcileRunResult {
  summary: ReconcileSummary;
  updatedExpenses: Expense[];
  updatedTransactions: StatementTransaction[];
  persistedRemotely: boolean;
}

function filterExpenses(expenses: Expense[], expenseIds?: string[]): Expense[] {
  if (!expenseIds?.length) return expenses;
  const ids = new Set(expenseIds);
  return expenses.filter((expense) => ids.has(expense.id));
}

function applyMatchesLocally(
  expenses: Expense[],
  transactions: StatementTransaction[],
  matches: ReconcileMatch[],
): { updatedExpenses: Expense[]; updatedTransactions: StatementTransaction[] } {
  const expenseById = new Map(expenses.map((expense) => [expense.id, expense]));
  const txnById = new Map(transactions.map((txn) => [txn.id, txn]));
  const updatedExpenses = [...expenses];
  const updatedTransactions = [...transactions];

  for (const match of matches) {
    const expense = expenseById.get(match.expenseId);
    const txn = txnById.get(match.statementTransactionId);
    if (!expense || !txn) continue;

    const nextExpense = applyReconcileMatchToExpense(expense, match);
    const expenseIndex = updatedExpenses.findIndex((e) => e.id === expense.id);
    if (expenseIndex >= 0) updatedExpenses[expenseIndex] = nextExpense;

    const txnIndex = updatedTransactions.findIndex((t) => t.id === txn.id);
    if (txnIndex >= 0) {
      updatedTransactions[txnIndex] = {
        ...txn,
        matchedExpenseId: expense.id,
      };
    }
  }

  return { updatedExpenses, updatedTransactions };
}

export async function runStatementReconciliation(
  input: ReconcileRunInput,
): Promise<ReconcileRunResult> {
  let expenses = input.expenses ?? [];
  let transactions = input.transactions ?? [];
  let persistedRemotely = false;

  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY),
  );

  if (hasSupabase && (!input.expenses || !input.transactions)) {
    try {
      const supabase = createAdminClient();
      expenses = input.expenses ?? (await fetchExpensesForOwner(supabase, input.ownerId));
      transactions =
        input.transactions ??
        (await fetchStatementTransactionsForOwner(supabase, input.ownerId));
    } catch {
      // Fall back to client-provided data below.
    }
  }

  expenses = filterExpenses(expenses, input.expenseIds);
  const summary = reconcileExpensesAgainstStatements(expenses, transactions);

  let { updatedExpenses, updatedTransactions } = applyMatchesLocally(
    input.expenses ?? expenses,
    input.transactions ?? transactions,
    summary.matches,
  );

  if (hasSupabase && summary.matches.length > 0) {
    try {
      const supabase = createAdminClient();
      const persistedExpenses: Expense[] = [];

      for (const match of summary.matches) {
        const updatedExpense = await updateExpenseReconcileForOwner(
          supabase,
          match.expenseId,
          input.ownerId,
          {
            creditCardReconciled: true,
            statementTransactionId: match.statementTransactionId,
          },
        );
        persistedExpenses.push(updatedExpense);

        await markStatementTransactionMatched(
          supabase,
          match.statementTransactionId,
          input.ownerId,
          match.expenseId,
        );
      }

      updatedExpenses = input.expenses
        ? updatedExpenses
        : await fetchExpensesForOwner(supabase, input.ownerId);
      updatedTransactions = input.transactions
        ? updatedTransactions
        : await fetchStatementTransactionsForOwner(supabase, input.ownerId);
      persistedRemotely = true;
    } catch {
      persistedRemotely = false;
    }
  }

  return {
    summary,
    updatedExpenses,
    updatedTransactions,
    persistedRemotely,
  };
}
