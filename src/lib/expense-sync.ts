import type { Expense } from "@/lib/types";
import type { ExpenseDateSort } from "@/lib/expense-grouping";
import { getOwnerId } from "@/lib/owner-id";

export type AccountingDecision = "approve" | "disapprove";

async function parseJsonResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Request failed",
    );
  }
  return data;
}

export async function fetchExpensesRemote(): Promise<Expense[]> {
  const ownerId = getOwnerId();
  const response = await fetch(
    `/api/expenses?ownerId=${encodeURIComponent(ownerId)}`,
  );
  const data = await parseJsonResponse(response);
  return data.expenses as Expense[];
}

export async function saveExpenseRemote(expense: Expense): Promise<Expense> {
  const ownerId = getOwnerId();
  const response = await fetch("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerId, expense }),
  });
  const data = await parseJsonResponse(response);
  return data.expense as Expense;
}

export async function deleteExpenseRemote(expenseId: string): Promise<void> {
  const ownerId = getOwnerId();
  const response = await fetch(
    `/api/expenses/${expenseId}?ownerId=${encodeURIComponent(ownerId)}`,
    { method: "DELETE" },
  );
  await parseJsonResponse(response);
}

export async function updateExpenseRemote(expense: Expense): Promise<Expense> {
  const ownerId = getOwnerId();
  const response = await fetch(`/api/expenses/${expense.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerId, expense }),
  });
  const data = await parseJsonResponse(response);
  return data.expense as Expense;
}

export async function submitAccountingDecisionRemote(
  expenseId: string,
  decision: AccountingDecision,
): Promise<{ expense: Expense; error?: string }> {
  const ownerId = getOwnerId();
  const response = await fetch(`/api/expenses/${expenseId}/accounting`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerId, decision }),
  });
  const data = await response.json();

  if (data.expense) {
    return {
      expense: data.expense as Expense,
      error:
        !response.ok && typeof data.error === "string"
          ? data.error
          : undefined,
    };
  }

  await parseJsonResponse(response);
  throw new Error("Accounting response was missing expense data.");
}

export async function exportToGoogleSheetsRemote(
  sort: ExpenseDateSort,
): Promise<{ spreadsheetUrl: string; fallback?: "csv" }> {
  const ownerId = getOwnerId();
  const response = await fetch("/api/export/google-sheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerId, sort }),
  });
  const data = await response.json();

  if (response.ok && typeof data.spreadsheetUrl === "string") {
    return { spreadsheetUrl: data.spreadsheetUrl };
  }

  if (response.status === 503 && data.fallback === "csv") {
    return { spreadsheetUrl: "", fallback: "csv" };
  }

  throw new Error(
    typeof data.error === "string"
      ? data.error
      : "Could not export expenses to Google Sheets.",
  );
}
