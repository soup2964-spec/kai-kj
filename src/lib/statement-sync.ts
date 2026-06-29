import type { Expense } from "@/lib/types";
import type { StatementTransaction } from "@/lib/statement-types";
import type { ReconcileRunResult } from "@/lib/reconcile-service";
import { getOwnerId } from "@/lib/owner-id";

const STATEMENTS_STORAGE_KEY = "kai-kj-statements";

function readLocalStatementTransactions(): StatementTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STATEMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { transactions?: StatementTransaction[] };
    return parsed.transactions ?? [];
  } catch {
    return [];
  }
}

function readLocalExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("kai-kj-expenses");
    if (!raw) return [];
    return JSON.parse(raw) as Expense[];
  } catch {
    return [];
  }
}

async function parseJsonResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Request failed",
    );
  }
  return data;
}

export async function reconcileStatementsRemote(options?: {
  expenseId?: string;
  expenseIds?: string[];
  expenses?: Expense[];
  transactions?: StatementTransaction[];
}): Promise<ReconcileRunResult> {
  const ownerId = getOwnerId();
  const response = await fetch("/api/statements/reconcile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ownerId,
      expenseId: options?.expenseId,
      expenseIds: options?.expenseIds,
      expenses: options?.expenses ?? readLocalExpenses(),
      transactions:
        options?.transactions ?? readLocalStatementTransactions(),
    }),
  });

  return parseJsonResponse(response) as Promise<ReconcileRunResult>;
}

export function applyReconcileToLocalStatements(
  updatedTransactions: StatementTransaction[],
) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STATEMENTS_STORAGE_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as { uploads?: unknown[]; transactions?: StatementTransaction[] })
      : { uploads: [], transactions: [] };
    const byId = new Map(updatedTransactions.map((txn) => [txn.id, txn]));
    const transactions = (parsed.transactions ?? []).map(
      (txn) => byId.get(txn.id) ?? txn,
    );
    localStorage.setItem(
      STATEMENTS_STORAGE_KEY,
      JSON.stringify({ ...parsed, transactions }),
    );
  } catch {
    // ignore local merge errors
  }
}
