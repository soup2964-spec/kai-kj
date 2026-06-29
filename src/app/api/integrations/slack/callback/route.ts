import { NextResponse } from "next/server";
import { apiErrorMessage } from "@/lib/expense-api";
import {
  appBaseUrl,
  decodeSlackOAuthState,
  exchangeSlackOAuthCode,
} from "@/lib/slack-oauth";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertOwnerSlackIntegration } from "@/lib/supabase/owner-integrations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const slackError = searchParams.get("error");
  const redirectBase = `${appBaseUrl(request)}/dashboard/agent`;

  if (slackError) {
    return NextResponse.redirect(
      `${redirectBase}?slack=error&message=${encodeURIComponent(slackError)}`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${redirectBase}?slack=error&message=${encodeURIComponent("Missing Slack OAuth code.")}`,
    );
  }

  const ownerId = decodeSlackOAuthState(state);
  if (!ownerId) {
    return NextResponse.redirect(
      `${redirectBase}?slack=error&message=${encodeURIComponent("Invalid Slack OAuth state.")}`,
    );
  }

  try {
    const slack = await exchangeSlackOAuthCode(request, code);
    const supabase = createAdminClient();
    await upsertOwnerSlackIntegration(supabase, ownerId, {
      webhookUrl: slack.webhookUrl,
      teamName: slack.teamName,
      channelName: slack.channelName,
    });

    return NextResponse.redirect(`${redirectBase}?slack=connected`);
  } catch (error) {
    return NextResponse.redirect(
      `${redirectBase}?slack=error&message=${encodeURIComponent(
        apiErrorMessage(error, "Could not connect Slack."),
      )}`,
    );
  }
}
