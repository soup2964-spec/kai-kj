import { NextResponse } from "next/server";
import { apiErrorMessage } from "@/lib/expense-api";
import { authErrorStatus, requireOwnerId } from "@/lib/auth/server";
import { runStatementReconciliation } from "@/lib/reconcile-service";
import type { Expense } from "@/lib/types";
import type { StatementTransaction } from "@/lib/statement-types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ownerId = await requireOwnerId(body.ownerId);
    const expenseIds = Array.isArray(body.expenseIds)
      ? body.expenseIds.filter((id: unknown): id is string => typeof id === "string")
      : undefined;

    const expenseId =
      typeof body.expenseId === "string" && body.expenseId.trim()
        ? body.expenseId.trim()
        : undefined;

    const ids = expenseId ? [expenseId, ...(expenseIds ?? [])] : expenseIds;

    const expenses = Array.isArray(body.expenses)
      ? (body.expenses as Expense[])
      : undefined;
    const transactions = Array.isArray(body.transactions)
      ? (body.transactions as StatementTransaction[])
      : undefined;

    const result = await runStatementReconciliation({
      ownerId,
      expenseIds: ids,
      expenses,
      transactions,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not reconcile statements.") },
      { status: authErrorStatus(error) },
    );
  }
}
