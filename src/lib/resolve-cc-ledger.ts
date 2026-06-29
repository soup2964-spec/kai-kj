import { isGoogleSheetsExportConfigured } from "@/lib/google-sheets-export";
import { googleSpreadsheetUrl } from "@/lib/integrations-types";
import {
  DEFAULT_SHEETS_LAYOUT,
  mergeSheetsLayoutConfig,
  parseSheetsLayoutConfig,
  type SheetsLayoutConfig,
} from "@/lib/sheets-layout";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchOwnerIntegrations } from "@/lib/supabase/owner-integrations";

export function getPlatformDefaultSpreadsheetId(): string | null {
  return (
    process.env.GOOGLE_SHEETS_CC_LEDGER_ID?.trim() ||
    process.env.GOOGLE_SHEETS_MASTER_ID?.trim() ||
    null
  );
}

export function getGoogleServiceAccountEmail(): string | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;

  try {
    const credentials = JSON.parse(raw) as { client_email?: string };
    return credentials.client_email ?? null;
  } catch {
    return null;
  }
}

/** Resolve which spreadsheet the agent should write to for this user. */
export async function resolveCcLedgerSpreadsheetId(
  ownerId: string | null | undefined,
): Promise<string> {
  if (ownerId) {
    try {
      const supabase = createAdminClient();
      const integration = await fetchOwnerIntegrations(supabase, ownerId);
      if (integration?.googleSheetsCcLedgerId) {
        return integration.googleSheetsCcLedgerId;
      }
    } catch {
      // Fall through to platform default.
    }
  }

  const fallback = getPlatformDefaultSpreadsheetId();
  if (fallback) return fallback;

  throw new Error(
    "Google Sheets is not connected for this account. Open Agent settings and connect your CC ledger spreadsheet.",
  );
}

export function isPlatformSheetsAvailable(): boolean {
  return isGoogleSheetsExportConfigured();
}

export function buildSpreadsheetUrl(spreadsheetId: string): string {
  return googleSpreadsheetUrl(spreadsheetId);
}

/** Resolve column mapping for this user's CC ledger writes. */
export async function resolveCcLedgerLayout(
  ownerId: string | null | undefined,
): Promise<SheetsLayoutConfig> {
  if (ownerId) {
    try {
      const supabase = createAdminClient();
      const integration = await fetchOwnerIntegrations(supabase, ownerId);
      if (integration?.googleSheetsLayoutConfig) {
        return parseSheetsLayoutConfig(integration.googleSheetsLayoutConfig);
      }
    } catch {
      // Fall through to default layout.
    }
  }

  return mergeSheetsLayoutConfig(null);
}
