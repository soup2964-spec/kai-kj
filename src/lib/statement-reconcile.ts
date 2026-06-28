import type { Expense } from "@/lib/types";
import type { StatementTransaction } from "@/lib/statement-types";

export interface ReconcileMatch {
  expenseId: string;
  statementTransactionId: string;
  score: number;
  merchant: string;
  amount: number;
  txnDate: string;
}

export interface ReconcileSummary {
  matches: ReconcileMatch[];
  unmatchedExpenseCount: number;
  unmatchedStatementCount: number;
}

const DATE_TOLERANCE_DAYS = 2;
const AMOUNT_TOLERANCE = 0.01;

function parseDate(value: string): Date | null {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysBetween(a: string, b: string): number | null {
  const dateA = parseDate(a);
  const dateB = parseDate(b);
  if (!dateA || !dateB) return null;
  return Math.abs(
    Math.round((dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function normalizeMerchant(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function merchantTokens(value: string): Set<string> {
  return new Set(
    normalizeMerchant(value)
      .split(" ")
      .filter((token) => token.length > 2),
  );
}

/** 0–1 similarity based on token overlap and substring checks. */
export function merchantSimilarity(a: string, b: string): number {
  const normA = normalizeMerchant(a);
  const normB = normalizeMerchant(b);
  if (!normA || !normB) return 0;
  if (normA.includes(normB) || normB.includes(normA)) return 1;

  const tokensA = merchantTokens(a);
  const tokensB = merchantTokens(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) overlap += 1;
  }

  return overlap / Math.max(tokensA.size, tokensB.size);
}

function amountsMatch(expenseAmount: number, statementAmount: number): boolean {
  return Math.abs(expenseAmount - statementAmount) <= AMOUNT_TOLERANCE;
}

function cardsCompatible(
  expenseCard: string | null | undefined,
  statementCard: string | null | undefined,
): boolean {
  if (!expenseCard || !statementCard) return true;
  return expenseCard === statementCard;
}

function scoreMatch(expense: Expense, txn: StatementTransaction): number | null {
  if (txn.matchedExpenseId && txn.matchedExpenseId !== expense.id) {
    return null;
  }

  if (expense.statementTransactionId && expense.statementTransactionId !== txn.id) {
    return null;
  }

  if (!amountsMatch(expense.amount, txn.amount)) return null;

  const dayDiff = daysBetween(expense.date, txn.txnDate);
  if (dayDiff == null || dayDiff > DATE_TOLERANCE_DAYS) return null;

  if (!cardsCompatible(expense.cardLastFour, txn.cardLastFour)) return null;

  const merchantScore = merchantSimilarity(expense.merchant, txn.merchant);
  if (merchantScore < 0.25) return null;

  const dateScore = 1 - dayDiff / (DATE_TOLERANCE_DAYS + 1);
  return merchantScore * 0.7 + dateScore * 0.3;
}

export function findBestStatementMatch(
  expense: Expense,
  transactions: StatementTransaction[],
): ReconcileMatch | null {
  let best: ReconcileMatch | null = null;

  for (const txn of transactions) {
    if (txn.matchedExpenseId) continue;

    const score = scoreMatch(expense, txn);
    if (score == null) continue;

    if (!best || score > best.score) {
      best = {
        expenseId: expense.id,
        statementTransactionId: txn.id,
        score,
        merchant: txn.merchant,
        amount: txn.amount,
        txnDate: txn.txnDate,
      };
    }
  }

  return best;
}

export function reconcileExpensesAgainstStatements(
  expenses: Expense[],
  transactions: StatementTransaction[],
): ReconcileSummary {
  const availableTxns = transactions.filter((txn) => !txn.matchedExpenseId);
  const usedTxnIds = new Set<string>();
  const matches: ReconcileMatch[] = [];

  const pendingExpenses = expenses.filter(
    (expense) => !expense.creditCardReconciled && !expense.statementTransactionId,
  );

  for (const expense of pendingExpenses) {
    const pool = availableTxns.filter((txn) => !usedTxnIds.has(txn.id));
    const match = findBestStatementMatch(expense, pool);
    if (!match) continue;

    usedTxnIds.add(match.statementTransactionId);
    matches.push(match);
  }

  const unmatchedExpenseCount = pendingExpenses.length - matches.length;
  const unmatchedStatementCount = availableTxns.length - matches.length;

  return {
    matches,
    unmatchedExpenseCount,
    unmatchedStatementCount,
  };
}

export function applyReconcileMatchToExpense(
  expense: Expense,
  match: ReconcileMatch,
): Expense {
  return {
    ...expense,
    creditCardReconciled: true,
    statementTransactionId: match.statementTransactionId,
    reconciledAt: new Date().toISOString(),
  };
}

export function applyReconcileMatchToStatement(
  txn: StatementTransaction,
  expenseId: string,
): StatementTransaction {
  return {
    ...txn,
    matchedExpenseId: expenseId,
  };
}
