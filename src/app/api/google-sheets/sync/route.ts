import { NextResponse } from "next/server";
import { apiErrorMessage } from "@/lib/expense-api";
import { authErrorStatus, requireOwnerId } from "@/lib/auth/server";
import {
  isCcLedgerConfigured,
} from "@/lib/google-sheets-ledger";
import {
  pullTransactionsFromSheet,
  pushExpensesToSheet,
} from "@/lib/google-sheets-sync";
import {
  createAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";
import {
  fetchExpensesForOwner,
  insertExpenseForOwner,
  updateExpenseForOwner,
} from "@/lib/supabase/expenses";
import type { Expense } from "@/lib/types";

type SyncDirection = "pull" | "push";

async function persistMergedExpenses(
  ownerId: string,
  existingIds: Set<string>,
  expenses: Awaited<ReturnType<typeof pullTransactionsFromSheet>>["expenses"],
) {
  if (!isSupabaseAdminConfigured()) return expenses;

  const supabase = createAdminClient();

  for (const expense of expenses) {
    try {
      if (existingIds.has(expense.id)) {
        await updateExpenseForOwner(supabase, expense, ownerId);
      } else {
        await insertExpenseForOwner(supabase, expense, ownerId);
        existingIds.add(expense.id);
      }
    } catch {
      // Keep going — partial sync is still useful.
    }
  }

  return expenses;
}

export async function POST(request: Request) {
  try {
    if (!isCcLedgerConfigured()) {
      return NextResponse.json(
        {
          error:
            "Google Sheets is not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON and connect your spreadsheet.",
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    const ownerId = await requireOwnerId(body.ownerId);
    const direction = (body.direction as SyncDirection) ?? "pull";
    const tab =
      typeof body.tab === "string" && body.tab.trim() ? body.tab.trim() : undefined;

    let existingExpenses: Expense[] = [];
    if (isSupabaseAdminConfigured()) {
      try {
        const supabase = createAdminClient();
        existingExpenses = await fetchExpensesForOwner(supabase, ownerId);
      } catch {
        existingExpenses = [];
      }
    }

    if (direction === "push") {
      const result = await pushExpensesToSheet(ownerId, existingExpenses);
      return NextResponse.json({ result });
    }

    const existingIds = new Set(existingExpenses.map((expense) => expense.id));
    const { expenses, result } = await pullTransactionsFromSheet(
      ownerId,
      existingExpenses,
      tab,
    );
    const saved = await persistMergedExpenses(ownerId, existingIds, expenses);

    return NextResponse.json({
      expenses: saved,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not sync with Google Sheets.") },
      { status: authErrorStatus(error) || 500 },
    );
  }
}
