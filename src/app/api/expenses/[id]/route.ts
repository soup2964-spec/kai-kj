import { NextResponse } from "next/server";
import { apiErrorMessage, parseExpensePayload } from "@/lib/expense-api";
import { authErrorStatus, requireOwnerId } from "@/lib/auth/server";
import {
  createAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";
import {
  deleteExpenseForOwner,
  updateExpenseForOwner,
} from "@/lib/supabase/expenses";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const ownerId = await requireOwnerId(body.ownerId);
    const expense = parseExpensePayload(body.expense);

    if (expense.id !== id) {
      return NextResponse.json(
        { error: "Expense id mismatch." },
        { status: 400 },
      );
    }

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({
        expense,
        storage: "local",
        warning:
          "Remote expense storage is not configured. Receipt update saved in this browser.",
      });
    }

    const supabase = createAdminClient();
    const saved = await updateExpenseForOwner(supabase, expense, ownerId);
    return NextResponse.json({ expense: saved });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not update expense.") },
      { status: authErrorStatus(error) },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const ownerId = await requireOwnerId(searchParams.get("ownerId"));
    const supabase = createAdminClient();
    await deleteExpenseForOwner(supabase, id, ownerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not delete expense.") },
      { status: authErrorStatus(error) },
    );
  }
}
