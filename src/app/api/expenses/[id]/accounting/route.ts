import { NextResponse } from "next/server";
import { applyAccountingDecision } from "@/lib/accounting-decision";
import { apiErrorMessage, parseExpensePayload } from "@/lib/expense-api";
import { authErrorStatus, requireOwnerId } from "@/lib/auth/server";
import {
  createAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";
import {
  fetchExpenseForOwner,
  updateExpenseAccountingForOwner,
} from "@/lib/supabase/expenses";
import type { Expense } from "@/lib/types";

type AccountingDecision = "approve" | "disapprove";

function parseAccountingDecision(value: unknown): AccountingDecision {
  if (value === "approve" || value === "disapprove") {
    return value;
  }

  throw new Error('decision must be "approve" or "disapprove".');
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const ownerId = await requireOwnerId(body.ownerId);
    const decision = parseAccountingDecision(body.decision);
    const fallbackExpense = body.expense
      ? parseExpensePayload(body.expense)
      : null;

    if (fallbackExpense && fallbackExpense.id !== id) {
      return NextResponse.json(
        { error: "Expense id mismatch." },
        { status: 400 },
      );
    }

    if (!isSupabaseAdminConfigured()) {
      if (!fallbackExpense) {
        return NextResponse.json(
          {
            error:
              "Receipt data is required to update accounting status in local storage.",
          },
          { status: 400 },
        );
      }

      const { expense: updated, error } = await applyAccountingDecision(
        fallbackExpense,
        decision,
      );

      return NextResponse.json(
        {
          expense: updated,
          error,
          storage: "local",
          warning:
            "Remote expense storage is not configured. Accounting status saved in this browser.",
        },
        error ? { status: 502 } : undefined,
      );
    }

    const supabase = createAdminClient();
    let expense: Expense | null = null;

    try {
      expense = await fetchExpenseForOwner(supabase, id, ownerId);
    } catch {
      expense = fallbackExpense;
    }

    if (!expense) {
      return NextResponse.json(
        { error: "Receipt not found." },
        { status: 404 },
      );
    }

    const { expense: updated, error } = await applyAccountingDecision(
      expense,
      decision,
    );

    try {
      const saved = await updateExpenseAccountingForOwner(
        supabase,
        id,
        ownerId,
        {
          accountingStatus: updated.accountingStatus,
          accountingSyncedAt: updated.accountingSyncedAt ?? null,
          accountingReference: updated.accountingReference ?? null,
          accountingError: updated.accountingError ?? null,
        },
      );

      return NextResponse.json(
        { expense: saved, error },
        error ? { status: 502 } : undefined,
      );
    } catch {
      return NextResponse.json({
        expense: updated,
        error,
        storage: "local",
        warning:
          "Remote expense storage is unavailable. Accounting status saved in this browser.",
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not update accounting status.") },
      { status: authErrorStatus(error) },
    );
  }
}
