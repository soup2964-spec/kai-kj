import { NextResponse } from "next/server";
import { apiErrorMessage } from "@/lib/expense-api";
import { authErrorStatus, requireOwnerId } from "@/lib/auth/server";
import {
  readSampleDataRows,
  readTabHeaderRow,
} from "@/lib/google-sheets-ledger";
import {
  resolveCcLedgerLayout,
  resolveCcLedgerSpreadsheetId,
} from "@/lib/resolve-cc-ledger";
import {
  mergeSheetsLayoutConfig,
  resolveLedgerTab,
  suggestLayoutFromSheetContext,
} from "@/lib/sheets-layout";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = await requireOwnerId(searchParams.get("ownerId"));
    const tabInput = searchParams.get("tab")?.trim();
    const cardLastFour = searchParams.get("cardLastFour")?.trim() || null;

    const spreadsheetId = await resolveCcLedgerSpreadsheetId(ownerId);
    const layout = await resolveCcLedgerLayout(ownerId);
    const tab = tabInput || resolveLedgerTab(layout, cardLastFour);

    const headers = await readTabHeaderRow(
      spreadsheetId,
      tab,
      layout.headerRow,
    );
    const sampleRows = await readSampleDataRows(spreadsheetId, tab, layout, 3, headers.length);
    const suggestion = await suggestLayoutFromSheetContext({
      headers,
      sampleRows,
      tabName: tab,
    });

    return NextResponse.json({
      tab,
      headerRow: layout.headerRow,
      headers,
      sampleRows,
      suggestedColumns: suggestion.columns,
      mappingSource: suggestion.mappingSource,
      llmConfidence: suggestion.llmConfidence ?? null,
      llmNotes: suggestion.llmNotes ?? null,
      suggestedLayout: mergeSheetsLayoutConfig({
        ...layout,
        createMissingTabs: false,
        columns: {
          ...layout.columns,
          ...suggestion.columns,
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
