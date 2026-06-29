import { NextResponse } from "next/server";
import { apiErrorMessage } from "@/lib/expense-api";
import { authErrorStatus, requireOwnerId } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearOwnerSlackIntegration } from "@/lib/supabase/owner-integrations";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = await requireOwnerId(searchParams.get("ownerId"));
    const supabase = createAdminClient();
    await clearOwnerSlackIntegration(supabase, ownerId);
    return NextResponse.json({ ownerId, disconnected: true });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not disconnect Slack.") },
      { status: authErrorStatus(error) },
    );
  }
}
