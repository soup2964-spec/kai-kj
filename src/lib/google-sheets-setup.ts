import type { GoogleSheetsIntegrationStatus } from "@/lib/integrations-store";

export type GoogleSheetsSetupPhase =
  | "unavailable"
  | "needs_share"
  | "needs_connect"
  | "needs_mapping"
  | "ready";

export const GOOGLE_SHEETS_SETUP_STEPS = [
  {
    step: 1,
    title: "Share your spreadsheet",
    description:
      "In Google Sheets, click Share and add the Moodna service account as Editor.",
  },
  {
    step: 2,
    title: "Connect your spreadsheet",
    description:
      "Paste your CC ledger URL (include gid=… if you use one tab). Moodna stores it per account.",
  },
  {
    step: 3,
    title: "Confirm column mapping",
    description:
      "Gemini reads your header row and sample data, then maps columns automatically. Adjust if needed.",
  },
] as const;

export const INTEGRATIONS_SETTINGS_PATH = "/dashboard/agent";

export function getGoogleSheetsSetupPhase(
  status: GoogleSheetsIntegrationStatus | null,
): GoogleSheetsSetupPhase {
  if (!status?.platformSheetsAvailable) return "unavailable";
  if (!status.connected) {
    return status.serviceAccountEmail ? "needs_connect" : "needs_share";
  }
  if (!status.layoutConfigured || !status.layoutValid) return "needs_mapping";
  return "ready";
}

export function isGoogleSheetsSyncReady(
  status: GoogleSheetsIntegrationStatus | null,
): boolean {
  return getGoogleSheetsSetupPhase(status) === "ready";
}

export function googleSheetsSetupSummary(
  status: GoogleSheetsIntegrationStatus | null,
): string {
  switch (getGoogleSheetsSetupPhase(status)) {
    case "unavailable":
      return "Google Sheets is not enabled on this deployment yet.";
    case "needs_share":
      return "Ask your admin to configure Google Sheets, then share your spreadsheet.";
    case "needs_connect":
      return "Connect your CC ledger spreadsheet to sync transactions.";
    case "needs_mapping":
      return "Finish column mapping so Moodna knows where to read and write rows.";
    case "ready":
      return "Your spreadsheet is connected. Changes sync automatically.";
  }
}
