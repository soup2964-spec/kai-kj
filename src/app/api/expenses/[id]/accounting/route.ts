import { NextResponse } from "next/server";
import { exportExpenseToAccounting } from "@/lib/accounting-export";
import { apiErrorMessage } from "@/lib/expense-api";
import { authErrorStatus, requireOwnerId } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchExpenseForOwner,
  updateExpenseAccountingForOwner,
} from "@/lib/supabase/expenses";

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
    const supabase = createAdminClient();

    if (decision === "disapprove") {
      const expense = await updateExpenseAccountingForOwner(
        supabase,
        id,
        ownerId,
        {
          accountingStatus: "rejected",
          accountingSyncedAt: null,
          accountingReference: null,
          accountingError: null,
        },
      );

      return NextResponse.json({ expense });
    }

    const expense = await fetchExpenseForOwner(supabase, id, ownerId);

    try {
      const exportResult = await exportExpenseToAccounting(expense);
      const updated = await updateExpenseAccountingForOwner(
        supabase,
        id,
        ownerId,
        {
          accountingStatus: "synced",
          accountingSyncedAt: new Date().toISOString(),
          accountingReference: exportResult.referenceId,
          accountingError: null,
        },
      );

      return NextResponse.json({
        expense: updated,
        export: exportResult,
      });
    } catch (error) {
      const message = apiErrorMessage(
        error,
        "Could not send receipt to accounting software.",
      );
      const updated = await updateExpenseAccountingForOwner(
        supabase,
        id,
        ownerId,
        {
          accountingStatus: "failed",
          accountingSyncedAt: null,
          accountingReference: null,
          accountingError: message,
        },
      );

      return NextResponse.json({ expense: updated, error: message }, { status: 502 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not update accounting status.") },
      { status: authErrorStatus(error) },
    );
  }
}
