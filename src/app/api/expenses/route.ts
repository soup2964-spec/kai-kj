import { NextResponse } from "next/server";
import {
  apiErrorMessage,
  parseExpensePayload,
  parseOwnerId,
} from "@/lib/expense-api";
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
    parseOwnerId(searchParams.get("ownerId"));

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({
        expenses: [],
        storage: "local",
        warning:
          "Remote expense storage is not configured. Receipts will stay in this browser.",
      });
    }

    const ownerId = parseOwnerId(searchParams.get("ownerId"));
    const supabase = createAdminClient();
    let expenses;
    try {
      expenses = await fetchExpensesForOwner(supabase, ownerId);
    } catch {
      return NextResponse.json({
        expenses: [],
        storage: "local",
        warning:
          "Remote expense storage is unavailable. Receipts will stay in this browser.",
      });
    }
    return NextResponse.json({ expenses });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not load expenses.") },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ownerId = parseOwnerId(body.ownerId);
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
    let saved;
    try {
      saved = await insertExpenseForOwner(supabase, expense, ownerId);
    } catch {
      return NextResponse.json({
        expense,
        storage: "local",
        warning:
          "Remote expense storage is unavailable. Receipt saved in this browser.",
      });
    }
    return NextResponse.json({ expense: saved });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not save expense.") },
      { status: 400 },
    );
  }
}
