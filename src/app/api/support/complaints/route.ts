import { NextResponse } from "next/server";
import { apiErrorMessage } from "@/lib/expense-api";
import { authErrorStatus, requireOwnerId } from "@/lib/auth/server";
import {
  createAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";
import {
  createLocalSupportComplaint,
  fetchSupportComplaintsForOwner,
  insertSupportComplaintForOwner,
  parseSupportComplaintInput,
} from "@/lib/supabase/support-complaints";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = await requireOwnerId(searchParams.get("ownerId"));

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({
        complaints: [],
        storage: "local",
        warning:
          "Remote support storage is not configured. Complaints stay in this browser.",
      });
    }

    const supabase = createAdminClient();
    let complaints;
    try {
      complaints = await fetchSupportComplaintsForOwner(supabase, ownerId);
    } catch {
      return NextResponse.json({
        complaints: [],
        storage: "local",
        warning:
          "Remote support storage is unavailable. Complaints stay in this browser.",
      });
    }
    return NextResponse.json({ complaints });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not load support inbox.") },
      { status: authErrorStatus(error) },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ownerId = await requireOwnerId(body.ownerId);
    const input = parseSupportComplaintInput(body.complaint);

    if (!isSupabaseAdminConfigured()) {
      const complaint = createLocalSupportComplaint(input);
      return NextResponse.json({
        complaint,
        storage: "local",
        warning:
          "Remote support storage is not configured. Complaint saved in this browser.",
      });
    }

    const supabase = createAdminClient();
    const complaint = await insertSupportComplaintForOwner(
      supabase,
      ownerId,
      input,
    );
    return NextResponse.json({ complaint });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not submit complaint.") },
      { status: authErrorStatus(error) },
    );
  }
}
