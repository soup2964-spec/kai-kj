export interface WorkOrderAlertPayload {
  ownerId?: string | null;
  expenseId?: string | null;
  vendor?: string | null;
  amount?: number | null;
  date?: string | null;
  cardLastFour?: string | null;
  googleSheetTab?: string | null;
  creditCardTab?: string | null;
}

export function buildWorkOrderAlertMessage(payload: WorkOrderAlertPayload): string {
  const amount =
    typeof payload.amount === "number"
      ? `$${payload.amount.toFixed(2)}`
      : String(payload.amount ?? "—");
  const tab =
    payload.googleSheetTab ?? payload.creditCardTab ?? "your CC tab";

  return [
    "Work order needed for billable receipt (ORANGE in Google Sheets).",
    `Vendor: ${payload.vendor ?? "Unknown"}`,
    `Amount: ${amount}`,
    `Date: ${payload.date ?? "—"}`,
    `Card: ****${payload.cardLastFour ?? "????"}`,
    `Expense ID: ${payload.expenseId ?? "—"}`,
    `Sheet tab: ${tab}`,
    "Action: Add AppFolio work order (xx-xxxx) to the ORANGE row, then resume processing.",
  ].join("\n");
}

export function parseNotifyEmails(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

export function serializeNotifyEmails(emails: string[]): string {
  return emails.join(", ");
}
