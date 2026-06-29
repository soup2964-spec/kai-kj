import { currentUser } from "@clerk/nextjs/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { apiErrorMessage } from "@/lib/expense-api";
import { authErrorStatus, requireOwnerId } from "@/lib/auth/server";
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
import { fetchOwnerIntegrations } from "@/lib/supabase/owner-integrations";
import type { Database } from "@/lib/supabase/database.types";

function parseDateSort(value: unknown): ExpenseDateSort {
  if (value === "oldest") return "oldest";
  return "newest";
}

/**
 * Decide which email the exported sheet should be shared with.
 * Priority: the email the user connected in the Integrations tab, then their
 * Clerk account email. Both are per-user — there is no global default.
 */
async function resolveShareEmail(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<string | null> {
  try {
    const integration = await fetchOwnerIntegrations(supabase, ownerId);
    const connected =
      integration?.smtpFrom?.trim() || integration?.smtpUser?.trim();
    if (connected) return connected;
  } catch {
    // Fall through to the Clerk account email.
  }

  try {
    const user = await currentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses?.[0]?.emailAddress;
    if (email) return email;
  } catch {
    // No usable email available.
  }

  return null;
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
    const ownerId = await requireOwnerId(body.ownerId);
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

    const shareEmail = await resolveShareEmail(supabase, ownerId);
    if (!shareEmail) {
      return NextResponse.json(
        {
          error:
            "Connect your email in the Integrations tab so we can share the exported Google Sheet with you.",
        },
        { status: 400 },
      );
    }

    const sheet = await exportExpensesToGoogleSheet(expenses, sort, shareEmail);
    return NextResponse.json(sheet);
  } catch (error) {
    return NextResponse.json(
      {
        error: apiErrorMessage(error, "Could not export expenses to Google Sheets."),
      },
      { status: authErrorStatus(error) },
    );
  }
}
