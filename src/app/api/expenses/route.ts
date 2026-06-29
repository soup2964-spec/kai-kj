import { NextResponse } from "next/server";
import {
  apiErrorMessage,
  parseExpensePayload,
} from "@/lib/expense-api";
import { authErrorStatus, requireOwnerId } from "@/lib/auth/server";
import {
  createAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";
import {
  fetchExpensesForOwner,
  insertExpenseForOwner,
} from "@/lib/supabase/expenses";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = await requireOwnerId(searchParams.get("ownerId"));

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({
        expenses: [],
        storage: "local",
        warning:
          "Remote expense storage is not configured. Receipts will stay in this browser.",
      });
    }

    const supabase = createAdminClient();
    const expenses = await fetchExpensesForOwner(supabase, ownerId);
    return NextResponse.json({ expenses });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not load expenses.") },
      { status: authErrorStatus(error) },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ownerId = await requireOwnerId(body.ownerId);
    const expense = parseExpensePayload(body.expense);

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({
        expense,
        storage: "local",
        warning:
          "Remote expense storage is not configured. Receipt saved in this browser.",
      });
    }

    const supabase = createAdminClient();
    const saved = await insertExpenseForOwner(supabase, expense, ownerId);
    return NextResponse.json({ expense: saved });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not save expense.") },
      { status: authErrorStatus(error) },
    );
  }
}
