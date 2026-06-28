import { NextResponse } from "next/server";
import {
  apiErrorMessage,
  parseExpensePayload,
  parseOwnerId,
} from "@/lib/expense-api";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchExpensesForOwner,
  insertExpenseForOwner,
} from "@/lib/supabase/expenses";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = parseOwnerId(searchParams.get("ownerId"));
    const supabase = createAdminClient();
    const expenses = await fetchExpensesForOwner(supabase, ownerId);
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
    const supabase = createAdminClient();
    const saved = await insertExpenseForOwner(supabase, expense, ownerId);
    return NextResponse.json({ expense: saved });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not save expense.") },
      { status: 400 },
    );
  }
}
