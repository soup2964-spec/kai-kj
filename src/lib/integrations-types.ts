export interface OwnerGoogleSheetsIntegration {
  ownerId: string;
  googleSheetsCcLedgerId: string | null;
  googleSheetsConnectedAt: string | null;
  googleSheetsLayoutConfig: unknown | null;
  slackWebhookUrl: string | null;
  slackTeamName: string | null;
  slackChannelName: string | null;
  slackConnectedAt: string | null;
  notifyEmails: string | null;
  notifyEmailsUpdatedAt: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPassword: string | null;
  smtpFrom: string | null;
  smtpConnectedAt: string | null;
  updatedAt: string;
}

export function parseGoogleSpreadsheetId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? null;
}

export function parseGoogleSpreadsheetGid(input: string): string | null {
  const match = input.trim().match(/[#&?]gid=(\d+)/);
  return match?.[1] ?? null;
}

export function googleSpreadsheetUrl(spreadsheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}
