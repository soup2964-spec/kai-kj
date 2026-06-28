import { NextResponse } from "next/server";
import { parseOwnerId } from "@/lib/expense-api";
import {
  buildSlackAuthorizeUrl,
  isSlackOAuthConfigured,
} from "@/lib/slack-oauth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = parseOwnerId(searchParams.get("ownerId"));

    if (!isSlackOAuthConfigured()) {
      return NextResponse.json(
        {
          error:
            "Slack is not configured on this deployment. Ask your admin to set SLACK_CLIENT_ID and SLACK_CLIENT_SECRET.",
        },
        { status: 503 },
      );
    }

    const url = buildSlackAuthorizeUrl(request, ownerId);
    return NextResponse.redirect(url);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not start Slack connect.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
