import { NextResponse } from "next/server";
import { apiErrorMessage } from "@/lib/expense-api";
import { authErrorStatus, requireOwnerId } from "@/lib/auth/server";
import {
  googleSpreadsheetUrl,
  parseGoogleSpreadsheetGid,
  parseGoogleSpreadsheetId,
} from "@/lib/integrations-types";
import {
  buildSpreadsheetUrl,
  getGoogleServiceAccountEmail,
  getPlatformDefaultSpreadsheetId,
  isDevSheetsFallbackEnabled,
  isPlatformSheetsAvailable,
} from "@/lib/resolve-cc-ledger";
import {
  getGoogleSheetsSetupPhase,
  isGoogleSheetsSyncReady,
} from "@/lib/google-sheets-setup";
import {
  getTabNameByGid,
  listSpreadsheetTabs,
  readSampleDataRows,
  readTabHeaderRow,
} from "@/lib/google-sheets-ledger";
import {
  CC_LEDGER_FIELD_DEFINITIONS,
  DEFAULT_SHEETS_LAYOUT,
  mergeSheetsLayoutConfig,
  parseSheetsLayoutConfig,
  suggestLayoutFromSheetContext,
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

async function buildInitialLayoutFromInput(
  spreadsheetId: string,
  rawInput: string,
): Promise<SheetsLayoutConfig> {
  const layoutConfig = mergeSheetsLayoutConfig(DEFAULT_SHEETS_LAYOUT);
  const gid = parseGoogleSpreadsheetGid(rawInput);

  let tab: string | null = null;
  if (gid) {
    tab = await getTabNameByGid(spreadsheetId, gid);
  }

  if (!tab) {
    const tabs = await listSpreadsheetTabs(spreadsheetId);
    if (tabs.length === 1) {
      tab = tabs[0]?.title ?? null;
    }
  }

  if (!tab) {
    throw new Error(
      "Could not detect which tab to use. Paste a spreadsheet URL that includes gid=… for your CC ledger tab.",
    );
  }

  const headers = await readTabHeaderRow(
    spreadsheetId,
    tab,
    layoutConfig.headerRow,
  );
  const sampleRows = await readSampleDataRows(
    spreadsheetId,
    tab,
    layoutConfig,
    3,
    headers.length,
  );
  const suggestion = await suggestLayoutFromSheetContext({
    headers,
    sampleRows,
    tabName: tab,
  });

  return mergeSheetsLayoutConfig({
    ...layoutConfig,
    fixedTab: tab,
    createMissingTabs: false,
    columns: {
      ...layoutConfig.columns,
      ...suggestion.columns,
    },
  });
}

function buildIntegrationPayload(
  ownerId: string,
  integration: Awaited<ReturnType<typeof fetchOwnerIntegrations>>,
) {
  const userSpreadsheetId = integration?.googleSheetsCcLedgerId ?? null;
  const devFallbackId =
    isDevSheetsFallbackEnabled() ? getPlatformDefaultSpreadsheetId() : null;
  const spreadsheetId = userSpreadsheetId ?? devFallbackId;
  const serviceAccountEmail = getGoogleServiceAccountEmail();
  const layoutConfig = resolveLayout(integration);
  const layoutErrors = validateSheetsLayoutConfig(layoutConfig);
  const layoutValid = layoutErrors.length === 0;
  const layoutConfigured = Boolean(integration?.googleSheetsLayoutConfig);
  const connected = Boolean(userSpreadsheetId);
  const status = {
    ownerId,
    connected,
    platformSheetsAvailable: isPlatformSheetsAvailable(),
    spreadsheetId: userSpreadsheetId,
    spreadsheetUrl: spreadsheetId ? buildSpreadsheetUrl(spreadsheetId) : null,
    connectedAt: integration?.googleSheetsConnectedAt ?? null,
    serviceAccountEmail,
    usingPlatformDefault: !userSpreadsheetId && Boolean(devFallbackId),
    layoutConfig,
    layoutConfigured,
    layoutValid,
    layoutErrors,
    fieldDefinitions: CC_LEDGER_FIELD_DEFINITIONS,
    defaultLayout: DEFAULT_SHEETS_LAYOUT,
  };

  return {
    ...status,
    setupPhase: getGoogleSheetsSetupPhase(status),
    setupComplete: isGoogleSheetsSyncReady(status),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = await requireOwnerId(searchParams.get("ownerId"));

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ...buildIntegrationPayload(ownerId, null),
        localOnly: true,
      });
    }

    const supabase = createAdminClient();
    const integration = await fetchOwnerIntegrations(supabase, ownerId);

    return NextResponse.json(buildIntegrationPayload(ownerId, integration));
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

    const layoutConfig = await buildInitialLayoutFromInput(spreadsheetId, rawInput);
    const layoutErrors = validateSheetsLayoutConfig(layoutConfig);
    const layoutValid = layoutErrors.length === 0;

    if (!isSupabaseConfigured()) {
      const payload = {
        ownerId,
        connected: true,
        localOnly: true,
        spreadsheetId,
        spreadsheetUrl: googleSpreadsheetUrl(spreadsheetId),
        connectedAt: new Date().toISOString(),
        serviceAccountEmail: getGoogleServiceAccountEmail(),
        platformSheetsAvailable: true,
        usingPlatformDefault: false,
        layoutConfig,
        layoutConfigured: layoutValid,
        layoutValid,
        layoutErrors,
        fieldDefinitions: CC_LEDGER_FIELD_DEFINITIONS,
        defaultLayout: DEFAULT_SHEETS_LAYOUT,
      };
      return NextResponse.json({
        ...payload,
        setupPhase: getGoogleSheetsSetupPhase(payload),
        setupComplete: isGoogleSheetsSyncReady(payload),
      });
    }

    const supabase = createAdminClient();
    let integration = await upsertOwnerGoogleSheetsLedger(
      supabase,
      ownerId,
      spreadsheetId,
    );

    if (layoutValid) {
      integration = await upsertOwnerGoogleSheetsLayout(
        supabase,
        ownerId,
        layoutConfig as unknown as Record<string, unknown>,
      );
    }

    return NextResponse.json(buildIntegrationPayload(ownerId, integration));
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

    return NextResponse.json(buildIntegrationPayload(ownerId, integration));
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

    return NextResponse.json(buildIntegrationPayload(ownerId, null));
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not disconnect Google Sheets.") },
      { status: 500 },
    );
  }
}
