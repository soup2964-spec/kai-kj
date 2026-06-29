import nodemailer from "nodemailer";
import {
  buildWorkOrderAlertMessage,
  type WorkOrderAlertPayload,
} from "@/lib/work-order-alert";
import type { OwnerSmtpConfig } from "@/lib/smtp-config";

export async function sendSlackWorkOrderAlert(
  webhookUrl: string,
  payload: WorkOrderAlertPayload,
): Promise<string> {
  const message = buildWorkOrderAlertMessage(payload);
  const vendor = payload.vendor ?? "Unknown vendor";
  const amountLabel =
    typeof payload.amount === "number"
      ? `$${payload.amount.toFixed(2)}`
      : String(payload.amount ?? "—");

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `Work order needed: ${vendor} ${amountLabel}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Work order needed (ORANGE receipt)",
          },
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: message },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed (${response.status})`);
  }

  return "Slack notification sent";
}

export async function sendEmailViaOwnerSmtp(
  smtp: OwnerSmtpConfig,
  recipients: string[],
  payload: WorkOrderAlertPayload,
): Promise<string> {
  if (recipients.length === 0) {
    throw new Error("Add at least one notification recipient email.");
  }

  const message = buildWorkOrderAlertMessage(payload);
  const vendor = payload.vendor ?? "Receipt";
  const subject = `[Moodna] Work order needed — ${vendor}`;

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.password,
    },
  });

  await transporter.verify();

  await transporter.sendMail({
    from: smtp.from,
    to: recipients.join(", "),
    subject,
    text: message,
  });

  return `Email sent from ${smtp.from} to ${recipients.join(", ")}`;
}

export async function verifyOwnerSmtpConnection(
  smtp: OwnerSmtpConfig,
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.password,
    },
  });

  await transporter.verify();
}
