import { NextResponse } from "next/server";
import { apiErrorMessage, parseOwnerId } from "@/lib/expense-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteExpenseForOwner } from "@/lib/supabase/expenses";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const ownerId = parseOwnerId(searchParams.get("ownerId"));
    const supabase = createAdminClient();
    await deleteExpenseForOwner(supabase, id, ownerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not delete expense.") },
      { status: 400 },
    );
  }
}
