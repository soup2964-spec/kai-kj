import { NextResponse } from "next/server";
import { apiErrorMessage } from "@/lib/expense-api";
import { authErrorStatus, requireOwnerId } from "@/lib/auth/server";
import {
  googleSpreadsheetUrl,
  parseGoogleSpreadsheetId,
} from "@/lib/integrations-types";
import {
  buildSpreadsheetUrl,
  getGoogleServiceAccountEmail,
  getPlatformDefaultSpreadsheetId,
  isPlatformSheetsAvailable,
} from "@/lib/resolve-cc-ledger";
import {
  CC_LEDGER_FIELD_DEFINITIONS,
  DEFAULT_SHEETS_LAYOUT,
  mergeSheetsLayoutConfig,
  parseSheetsLayoutConfig,
  validateSheetsLayoutConfig,
  type SheetsLayoutConfig,
} from "@/lib/sheets-layout";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  clearOwnerGoogleSheetsLedger,
  fetchOwnerIntegrations,
  upsertOwnerGoogleSheetsLedger,
  upsertOwnerGoogleSheetsLayout,
} from "@/lib/supabase/owner-integrations";

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

function resolveLayout(
  integration: Awaited<ReturnType<typeof fetchOwnerIntegrations>>,
): SheetsLayoutConfig {
  if (integration?.googleSheetsLayoutConfig) {
    return parseSheetsLayoutConfig(integration.googleSheetsLayoutConfig);
  }
  return mergeSheetsLayoutConfig(DEFAULT_SHEETS_LAYOUT);
}

function integrationResponse(
  ownerId: string,
  integration: Awaited<ReturnType<typeof fetchOwnerIntegrations>>,
) {
  const spreadsheetId =
    integration?.googleSheetsCcLedgerId ?? getPlatformDefaultSpreadsheetId();
  const serviceAccountEmail = getGoogleServiceAccountEmail();
  const layoutConfig = resolveLayout(integration);
  const layoutErrors = validateSheetsLayoutConfig(layoutConfig);

  return {
    ownerId,
    connected: Boolean(integration?.googleSheetsCcLedgerId),
    platformSheetsAvailable: isPlatformSheetsAvailable(),
    spreadsheetId: integration?.googleSheetsCcLedgerId ?? null,
    spreadsheetUrl: spreadsheetId ? buildSpreadsheetUrl(spreadsheetId) : null,
    connectedAt: integration?.googleSheetsConnectedAt ?? null,
    serviceAccountEmail,
    usingPlatformDefault:
      !integration?.googleSheetsCcLedgerId &&
      Boolean(getPlatformDefaultSpreadsheetId()),
    layoutConfig,
    layoutConfigured: Boolean(integration?.googleSheetsLayoutConfig),
    layoutValid: layoutErrors.length === 0,
    layoutErrors,
    fieldDefinitions: CC_LEDGER_FIELD_DEFINITIONS,
    defaultLayout: DEFAULT_SHEETS_LAYOUT,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = await requireOwnerId(searchParams.get("ownerId"));

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ...integrationResponse(ownerId, null),
        localOnly: true,
      });
    }

    const supabase = createAdminClient();
    const integration = await fetchOwnerIntegrations(supabase, ownerId);

    return NextResponse.json(integrationResponse(ownerId, integration));
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not load Google Sheets settings.") },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!isPlatformSheetsAvailable()) {
      return NextResponse.json(
        {
          error:
            "Google Sheets is not available on this deployment. Ask your admin to set GOOGLE_SERVICE_ACCOUNT_JSON.",
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    const ownerId = await requireOwnerId(body.ownerId);
    const rawInput = String(body.spreadsheetUrl ?? body.spreadsheetId ?? "").trim();

    if (!rawInput) {
      return NextResponse.json(
        { error: "Paste your CC ledger spreadsheet URL or ID." },
        { status: 400 },
      );
    }

    const spreadsheetId = parseGoogleSpreadsheetId(rawInput);
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Could not parse spreadsheet URL or ID." },
        { status: 400 },
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ownerId,
        connected: true,
        localOnly: true,
        spreadsheetId,
        spreadsheetUrl: googleSpreadsheetUrl(spreadsheetId),
        connectedAt: new Date().toISOString(),
        serviceAccountEmail: getGoogleServiceAccountEmail(),
        platformSheetsAvailable: true,
        layoutConfig: mergeSheetsLayoutConfig(DEFAULT_SHEETS_LAYOUT),
        layoutConfigured: false,
        layoutValid: true,
        layoutErrors: [],
        fieldDefinitions: CC_LEDGER_FIELD_DEFINITIONS,
        defaultLayout: DEFAULT_SHEETS_LAYOUT,
      });
    }

    const supabase = createAdminClient();
    const integration = await upsertOwnerGoogleSheetsLedger(
      supabase,
      ownerId,
      spreadsheetId,
    );

    return NextResponse.json(integrationResponse(ownerId, integration));
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not connect Google Sheets.") },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const ownerId = await requireOwnerId(body.ownerId);
    const layoutConfig = mergeSheetsLayoutConfig(body.layoutConfig);
    const layoutErrors = validateSheetsLayoutConfig(layoutConfig);

    if (layoutErrors.length > 0) {
      return NextResponse.json(
        { error: layoutErrors.join(" "), layoutErrors },
        { status: 400 },
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ownerId,
        layoutConfig,
        layoutConfigured: true,
        layoutValid: true,
        layoutErrors: [],
        localOnly: true,
      });
    }

    const supabase = createAdminClient();
    const integration = await upsertOwnerGoogleSheetsLayout(
      supabase,
      ownerId,
      layoutConfig as unknown as Record<string, unknown>,
    );

    return NextResponse.json(integrationResponse(ownerId, integration));
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not save column mapping.") },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = await requireOwnerId(searchParams.get("ownerId"));

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ownerId, disconnected: true, localOnly: true });
    }

    const supabase = createAdminClient();
    await clearOwnerGoogleSheetsLedger(supabase, ownerId);

    return NextResponse.json(integrationResponse(ownerId, null));
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not disconnect Google Sheets.") },
      { status: 500 },
    );
  }
}
