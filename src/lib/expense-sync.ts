import type { Expense } from "@/lib/types";
import { getOwnerId } from "@/lib/owner-id";

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
