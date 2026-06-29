import { NextResponse } from "next/server";
import { apiErrorMessage } from "@/lib/expense-api";
import { authErrorStatus, requireOwnerId } from "@/lib/auth/server";
import {
  sendEmailViaOwnerSmtp,
  verifyOwnerSmtpConnection,
} from "@/lib/notify-delivery";
import { isSlackOAuthConfigured } from "@/lib/slack-oauth";
import {
  isOwnerSmtpConfigured,
  ownerSmtpFromIntegration,
} from "@/lib/smtp-config";
import {
  parseNotifyEmails,
  serializeNotifyEmails,
} from "@/lib/work-order-alert";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  clearOwnerSmtpIntegration,
  fetchOwnerIntegrations,
  upsertOwnerNotifyEmails,
  upsertOwnerSmtpIntegration,
} from "@/lib/supabase/owner-integrations";

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

function notificationResponse(
  ownerId: string,
  integration: Awaited<ReturnType<typeof fetchOwnerIntegrations>>,
) {
  const emails = parseNotifyEmails(integration?.notifyEmails);
  const smtpConnected = isOwnerSmtpConfigured(integration);

  return {
    ownerId,
    slackConnected: Boolean(integration?.slackWebhookUrl),
    slackTeamName: integration?.slackTeamName ?? null,
    slackChannelName: integration?.slackChannelName ?? null,
    slackConnectedAt: integration?.slackConnectedAt ?? null,
    smtpConnected,
    smtpHost: integration?.smtpHost ?? null,
    smtpPort: integration?.smtpPort ?? 587,
    smtpUser: integration?.smtpUser ?? null,
    smtpFrom: integration?.smtpFrom ?? null,
    smtpConnectedAt: integration?.smtpConnectedAt ?? null,
    notifyEmails: emails,
    notifyEmailsRaw: integration?.notifyEmails ?? "",
    notifyEmailsUpdatedAt: integration?.notifyEmailsUpdatedAt ?? null,
    slackOAuthAvailable: isSlackOAuthConfigured(),
    notificationsConfigured: Boolean(
      integration?.slackWebhookUrl || (smtpConnected && emails.length > 0),
    ),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = await requireOwnerId(searchParams.get("ownerId"));

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ...notificationResponse(ownerId, null),
        localOnly: true,
      });
    }

    const supabase = createAdminClient();
    const integration = await fetchOwnerIntegrations(supabase, ownerId);
    return NextResponse.json(notificationResponse(ownerId, integration));
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not load notification settings.") },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const ownerId = await requireOwnerId(body.ownerId);
    const notifyEmailsRaw = String(body.notifyEmails ?? body.emails ?? "").trim();
    const hasSmtpFields =
      body.smtpHost != null ||
      body.host != null ||
      body.smtpUser != null ||
      body.user != null;

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase is required to store SMTP credentials securely." },
        { status: 503 },
      );
    }

    const supabase = createAdminClient();
    const existing = await fetchOwnerIntegrations(supabase, ownerId);

    if (!hasSmtpFields) {
      const recipients = parseNotifyEmails(notifyEmailsRaw);
      if (recipients.length === 0) {
        return NextResponse.json(
          { error: "Add at least one recipient email to notify." },
          { status: 400 },
        );
      }

      if (!isOwnerSmtpConfigured(existing)) {
        return NextResponse.json(
          { error: "Connect SMTP before saving notification recipients." },
          { status: 400 },
        );
      }

      const integration = await upsertOwnerNotifyEmails(
        supabase,
        ownerId,
        serializeNotifyEmails(recipients),
      );

      return NextResponse.json(notificationResponse(ownerId, integration));
    }

    const host = String(body.smtpHost ?? body.host ?? "").trim();
    const port = Number(body.smtpPort ?? body.port ?? 587);
    const user = String(body.smtpUser ?? body.user ?? "").trim();
    const from = String(body.smtpFrom ?? body.from ?? user).trim();
    const passwordRaw = body.smtpPassword ?? body.password;
    const recipients = parseNotifyEmails(notifyEmailsRaw);

    if (!host || !user || !from) {
      return NextResponse.json(
        { error: "SMTP host, username, and from address are required." },
        { status: 400 },
      );
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "Add at least one recipient email to notify." },
        { status: 400 },
      );
    }

    const password =
      typeof passwordRaw === "string" && passwordRaw.trim()
        ? passwordRaw.trim()
        : existing?.smtpPassword ?? "";

    if (!password) {
      return NextResponse.json(
        { error: "SMTP password or app password is required." },
        { status: 400 },
      );
    }

    const smtp = {
      host,
      port: Number.isFinite(port) ? port : 587,
      user,
      password,
      from,
    };

    await verifyOwnerSmtpConnection(smtp);

    const integration = await upsertOwnerSmtpIntegration(supabase, ownerId, {
      ...smtp,
      notifyEmails: serializeNotifyEmails(recipients),
    });

    return NextResponse.json(notificationResponse(ownerId, integration));
  } catch (error) {
    return NextResponse.json(
      {
        error: apiErrorMessage(
          error,
          "Could not connect email. Check SMTP settings and use an app password if required.",
        ),
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = await requireOwnerId(searchParams.get("ownerId"));
    const target = searchParams.get("target");

    if (target !== "smtp") {
      return NextResponse.json({ error: "Unsupported delete target." }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ownerId, disconnected: true, localOnly: true });
    }

    const supabase = createAdminClient();
    await clearOwnerSmtpIntegration(supabase, ownerId);
    const integration = await fetchOwnerIntegrations(supabase, ownerId);

    return NextResponse.json(notificationResponse(ownerId, integration));
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not disconnect email.") },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ownerId = await requireOwnerId(body.ownerId);
    const supabase = createAdminClient();
    const integration = await fetchOwnerIntegrations(supabase, ownerId);
    const smtp = ownerSmtpFromIntegration(integration ?? {
      smtpHost: null,
      smtpPort: null,
      smtpUser: null,
      smtpPassword: null,
      smtpFrom: null,
    });
    const recipients = parseNotifyEmails(integration?.notifyEmails);

    if (!smtp || recipients.length === 0) {
      return NextResponse.json(
        { error: "Connect SMTP and add recipients before sending a test email." },
        { status: 400 },
      );
    }

    await sendEmailViaOwnerSmtp(smtp, recipients, {
      vendor: "Test Vendor",
      amount: 42.99,
      date: new Date().toISOString().slice(0, 10),
      expenseId: "test-expense",
      cardLastFour: "1234",
      creditCardTab: "CC-1234",
    });

    return NextResponse.json({ ownerId, testSent: true });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Test email failed.") },
      { status: 400 },
    );
  }
}
