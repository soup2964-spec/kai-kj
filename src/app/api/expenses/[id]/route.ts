import { NextResponse } from "next/server";
import { apiErrorMessage, parseExpensePayload, parseOwnerId } from "@/lib/expense-api";
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
    const ownerId = parseOwnerId(body.ownerId);
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
    let saved;
    try {
      saved = await updateExpenseForOwner(supabase, expense, ownerId);
    } catch {
      return NextResponse.json({
        expense,
        storage: "local",
        warning:
          "Remote expense storage is unavailable. Receipt update saved in this browser.",
      });
    }
    return NextResponse.json({ expense: saved });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not update expense.") },
      { status: 400 },
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
    parseOwnerId(searchParams.get("ownerId"));

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({
        ok: true,
        storage: "local",
        warning:
          "Remote expense storage is not configured. Receipt deleted from this browser.",
      });
    }

    const ownerId = parseOwnerId(searchParams.get("ownerId"));
    const supabase = createAdminClient();
    try {
      await deleteExpenseForOwner(supabase, id, ownerId);
    } catch {
      return NextResponse.json({
        ok: true,
        storage: "local",
        warning:
          "Remote expense storage is unavailable. Receipt deleted from this browser.",
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not delete expense.") },
      { status: 400 },
    );
  }
}
