import { NextResponse } from "next/server";
import { apiErrorMessage, parseOwnerId } from "@/lib/expense-api";
import { ccTabName, readTabHeaderRow } from "@/lib/google-sheets-ledger";
import {
  resolveCcLedgerLayout,
  resolveCcLedgerSpreadsheetId,
} from "@/lib/resolve-cc-ledger";
import {
  mergeSheetsLayoutConfig,
  suggestLayoutFromHeaders,
} from "@/lib/sheets-layout";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = parseOwnerId(searchParams.get("ownerId"));
    const tabInput = searchParams.get("tab")?.trim();
    const cardLastFour = searchParams.get("cardLastFour")?.trim() || null;

    const spreadsheetId = await resolveCcLedgerSpreadsheetId(ownerId);
    const layout = await resolveCcLedgerLayout(ownerId);
    const tab = tabInput || ccTabName(cardLastFour, layout);

    const headers = await readTabHeaderRow(
      spreadsheetId,
      tab,
      layout.headerRow,
    );
    const suggestedColumns = suggestLayoutFromHeaders(headers);

    return NextResponse.json({
      tab,
      headerRow: layout.headerRow,
      headers,
      suggestedColumns,
      suggestedLayout: mergeSheetsLayoutConfig({
        ...layout,
        createMissingTabs: false,
        columns: {
          ...layout.columns,
          ...suggestedColumns,
        },
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: apiErrorMessage(
          error,
          "Could not read spreadsheet headers for auto-mapping.",
        ),
      },
      { status: 500 },
    );
  }
}
