import { NextResponse } from "next/server";
import { apiErrorMessage, parseOwnerId } from "@/lib/expense-api";
import type { ExpenseDateSort } from "@/lib/expense-grouping";
import {
  exportExpensesToGoogleSheet,
  isGoogleSheetsExportConfigured,
} from "@/lib/google-sheets-export";
import {
  createAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";
import { fetchExpensesForOwner } from "@/lib/supabase/expenses";

function parseDateSort(value: unknown): ExpenseDateSort {
  if (value === "oldest") return "oldest";
  return "newest";
}

export async function POST(request: Request) {
  try {
    if (!isGoogleSheetsExportConfigured()) {
      return NextResponse.json(
        {
          error:
            "Google Sheets export is not configured on the server. Set GOOGLE_SERVICE_ACCOUNT_JSON.",
          fallback: "csv",
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    const ownerId = parseOwnerId(body.ownerId);
    const sort = parseDateSort(body.sort);

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        {
          error:
            "Remote expense storage is not configured. Export the receipts saved in this browser as CSV.",
          fallback: "csv",
        },
        { status: 503 },
      );
    }

    const supabase = createAdminClient();
    const expenses = await fetchExpensesForOwner(supabase, ownerId);

    if (expenses.length === 0) {
      return NextResponse.json(
        { error: "No expenses to export." },
        { status: 400 },
      );
    }

    const sheet = await exportExpensesToGoogleSheet(expenses, sort);
    return NextResponse.json(sheet);
  } catch (error) {
    return NextResponse.json(
      {
        error: apiErrorMessage(error, "Could not export expenses to Google Sheets."),
      },
      { status: 500 },
    );
  }
}
