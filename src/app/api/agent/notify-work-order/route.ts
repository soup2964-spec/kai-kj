import { NextResponse } from "next/server";
import { apiErrorMessage, parseOwnerId } from "@/lib/expense-api";
import {
  sendEmailViaOwnerSmtp,
  sendSlackWorkOrderAlert,
} from "@/lib/notify-delivery";
import { ownerSmtpFromIntegration } from "@/lib/smtp-config";
import { parseNotifyEmails, type WorkOrderAlertPayload } from "@/lib/work-order-alert";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchOwnerIntegrations } from "@/lib/supabase/owner-integrations";

function parsePayload(body: Record<string, unknown>): WorkOrderAlertPayload {
  return {
    ownerId:
      typeof body.ownerId === "string"
        ? body.ownerId
        : typeof body.owner_id === "string"
          ? body.owner_id
          : null,
    expenseId:
      typeof body.expenseId === "string"
        ? body.expenseId
        : typeof body.expense_id === "string"
          ? body.expense_id
          : null,
    vendor:
      typeof body.vendor === "string"
        ? body.vendor
        : typeof body.merchant === "string"
          ? body.merchant
          : null,
    amount:
      typeof body.amount === "number"
        ? body.amount
        : body.amount != null
          ? Number(body.amount)
          : null,
    date: typeof body.date === "string" ? body.date : null,
    cardLastFour:
      typeof body.cardLastFour === "string"
        ? body.cardLastFour
        : typeof body.card_last_four === "string"
          ? body.card_last_four
          : null,
    googleSheetTab:
      typeof body.googleSheetTab === "string"
        ? body.googleSheetTab
        : typeof body.google_sheet_tab === "string"
          ? body.google_sheet_tab
          : null,
    creditCardTab:
      typeof body.creditCardTab === "string"
        ? body.creditCardTab
        : typeof body.credit_card_tab === "string"
          ? body.credit_card_tab
          : typeof body.tab === "string"
            ? body.tab
            : null,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ownerId = parseOwnerId(body.ownerId ?? body.owner_id);
    const payload = parsePayload(body);

    const supabase = createAdminClient();
    const integration = await fetchOwnerIntegrations(supabase, ownerId);

    if (!integration) {
      return NextResponse.json(
        {
          error:
            "No notification settings for this account. Connect Slack or SMTP in Agent settings.",
        },
        { status: 503 },
      );
    }

    const deliveries: string[] = [];
    const emails = parseNotifyEmails(integration.notifyEmails);

    if (integration.slackWebhookUrl) {
      try {
        deliveries.push(
          await sendSlackWorkOrderAlert(integration.slackWebhookUrl, payload),
        );
      } catch (error) {
        deliveries.push(
          error instanceof Error ? `Slack failed: ${error.message}` : "Slack failed",
        );
      }
    }

    if (emails.length > 0) {
      const smtp = ownerSmtpFromIntegration(integration);
      if (smtp) {
        try {
          deliveries.push(await sendEmailViaOwnerSmtp(smtp, emails, payload));
        } catch (error) {
          deliveries.push(
            error instanceof Error ? `Email failed: ${error.message}` : "Email failed",
          );
        }
      }
    }

    if (deliveries.length === 0) {
      return NextResponse.json(
        {
          error:
            "Notifications are not configured for this account. Connect Slack or connect SMTP with recipients.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ownerId,
      deliveries,
      notified: deliveries.some((entry) => !entry.toLowerCase().includes("failed")),
    });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not send work order notification.") },
      { status: 500 },
    );
  }
}
