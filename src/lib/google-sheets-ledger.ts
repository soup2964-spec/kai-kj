import type { CcLedgerRowInput, CcLedgerSheetStatus } from "@/lib/cc-ledger-types";
import { google } from "googleapis";
import { isGoogleSheetsExportConfigured } from "@/lib/google-sheets-export";
import {
  buildMappedCellUpdates,
  buildStatusCellUpdates,
  columnLetterToIndex,
  DEFAULT_SHEETS_LAYOUT,
  expenseIdColumn,
  indexToColumnLetter,
  resolveLedgerTab,
  type CcLedgerFieldKey,
  type SheetsLayoutConfig,
} from "@/lib/sheets-layout";

export type { CcLedgerRowInput, CcLedgerSheetStatus } from "@/lib/cc-ledger-types";
export { DEFAULT_SHEETS_LAYOUT } from "@/lib/sheets-layout";

/** Default Moodna column headers when creating a new tab. */
export const CC_LEDGER_HEADERS = [
  "Date",
  "Merchant",
  "Amount",
  "Category",
  "Billable Status",
  "Billable Reason",
  "Work Order",
  "Card",
  "Sheet Status",
  "Reconciled",
  "Expense ID",
] as const;

function getServiceAccountCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error(
      "Google Sheets is not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON.",
    );
  }

  const credentials = JSON.parse(raw) as {
    client_email?: string;
    private_key?: string;
  };

  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key.");
  }

  return credentials;
}

export function ccTabName(
  cardLastFour: string | null | undefined,
  layout: SheetsLayoutConfig = DEFAULT_SHEETS_LAYOUT,
): string {
  return resolveLedgerTab(layout, cardLastFour);
}

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getServiceAccountCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

async function tabExists(spreadsheetId: string, tabName: string): Promise<boolean> {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  return Boolean(
    meta.data.sheets?.some((sheet) => sheet.properties?.title === tabName),
  );
}

async function ensureTabExists(
  spreadsheetId: string,
  tabName: string,
  layout: SheetsLayoutConfig,
) {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = meta.data.sheets?.find(
    (sheet) => sheet.properties?.title === tabName,
  );

  if (existing?.properties?.sheetId != null) {
    return existing.properties.sheetId;
  }

  if (!layout.createMissingTabs) {
    throw new Error(
      `Tab "${tabName}" was not found in your spreadsheet. Create it or enable automatic tab creation in your column mapping.`,
    );
  }

  const created = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: tabName } } }],
    },
  });

  const sheetId =
    created.data.replies?.[0]?.addSheet?.properties?.sheetId ?? null;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [Array.from(CC_LEDGER_HEADERS)],
    },
  });

  if (sheetId != null) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: { textFormat: { bold: true } },
              },
              fields: "userEnteredFormat.textFormat.bold",
            },
          },
        ],
      },
    });
  }

  return sheetId;
}

async function writeCellUpdates(
  spreadsheetId: string,
  updates: Array<{ range: string; values: string[][] }>,
) {
  if (updates.length === 0) return;

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: updates,
    },
  });
}

async function findNextDataRow(
  spreadsheetId: string,
  tab: string,
  layout: SheetsLayoutConfig,
): Promise<number> {
  const column = expenseIdColumn(layout);
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tab}'!${column}${layout.dataStartRow}:${column}`,
  });

  const rows = response.data.values ?? [];
  if (rows.length === 0) {
    return layout.dataStartRow;
  }

  for (let index = rows.length - 1; index >= 0; index--) {
    if (rows[index]?.[0]) {
      return layout.dataStartRow + index + 1;
    }
  }

  return layout.dataStartRow;
}

/** Platform service account is configured (each user still connects their own sheet). */
export function isCcLedgerConfigured(): boolean {
  return isGoogleSheetsExportConfigured();
}

export interface AppendCcLedgerResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  tab: string;
  rowNumber: number;
  range: string;
}

/** Append one CC transaction row using the user's column mapping. */
export async function appendCcTransactionToLedger(
  spreadsheetId: string,
  row: CcLedgerRowInput,
  layout: SheetsLayoutConfig,
  tabOverride?: string,
): Promise<AppendCcLedgerResult> {
  const tab = tabOverride ?? ccTabName(row.cardLastFour, layout);
  await ensureTabExists(spreadsheetId, tab, layout);

  const rowNumber = await findNextDataRow(spreadsheetId, tab, layout);
  const updates = buildMappedCellUpdates(layout, tab, rowNumber, row);
  await writeCellUpdates(spreadsheetId, updates);

  const firstColumn = updates[0]?.range.match(/!([A-Z]+)/)?.[1] ?? "A";

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0`,
    tab,
    rowNumber,
    range: `'${tab}'!${firstColumn}${rowNumber}`,
  };
}

/** Update mapped Sheet Status + Reconciled cells for an existing row. */
export async function updateCcLedgerRowStatus(
  spreadsheetId: string,
  tab: string,
  rowNumber: number,
  layout: SheetsLayoutConfig,
  update: { sheetStatus?: CcLedgerSheetStatus; reconciled?: boolean },
): Promise<void> {
  if (rowNumber < layout.dataStartRow) return;

  const updates = buildStatusCellUpdates(layout, tab, rowNumber, update);
  await writeCellUpdates(spreadsheetId, updates);
}

/** Replace mapped cells when an ORANGE row gets VA transaction details. */
export async function replaceCcLedgerRow(
  spreadsheetId: string,
  tab: string,
  rowNumber: number,
  layout: SheetsLayoutConfig,
  row: CcLedgerRowInput,
): Promise<void> {
  if (rowNumber < layout.dataStartRow) return;

  const updates = buildMappedCellUpdates(layout, tab, rowNumber, row);
  await writeCellUpdates(spreadsheetId, updates);
}

/** Find row number by expense ID in the user's mapped column. */
export async function findCcLedgerRowByExpenseId(
  spreadsheetId: string,
  tab: string,
  expenseId: string,
  layout: SheetsLayoutConfig,
): Promise<number | null> {
  const column = expenseIdColumn(layout);
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tab}'!${column}${layout.dataStartRow}:${column}`,
  });

  const rows = response.data.values ?? [];
  for (let index = 0; index < rows.length; index++) {
    if (rows[index]?.[0] === expenseId) {
      return layout.dataStartRow + index;
    }
  }

  return null;
}

/** Read header labels from a tab for auto-mapping. */
export async function readTabHeaderRow(
  spreadsheetId: string,
  tab: string,
  headerRow: number,
): Promise<string[]> {
  if (!(await tabExists(spreadsheetId, tab))) {
    throw new Error(`Tab "${tab}" was not found in your spreadsheet.`);
  }

  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tab}'!${headerRow}:${headerRow}`,
  });

  return (response.data.values?.[0] ?? []).map((value) => String(value ?? ""));
}

export async function listSpreadsheetTabs(
  spreadsheetId: string,
): Promise<Array<{ title: string; sheetId: number }>> {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });

  return (meta.data.sheets ?? [])
    .map((sheet) => ({
      title: sheet.properties?.title ?? "",
      sheetId: sheet.properties?.sheetId ?? 0,
    }))
    .filter((sheet) => sheet.title.length > 0);
}

export async function getTabNameByGid(
  spreadsheetId: string,
  gid: string,
): Promise<string | null> {
  const numericGid = Number(gid);
  if (!Number.isFinite(numericGid)) return null;

  const tabs = await listSpreadsheetTabs(spreadsheetId);
  const match = tabs.find((tab) => tab.sheetId === numericGid);
  return match?.title ?? null;
}

export interface CcLedgerSheetRow {
  rowNumber: number;
  values: Partial<Record<CcLedgerFieldKey, string>>;
}

function mappedColumnRange(layout: SheetsLayoutConfig): {
  startColumn: string;
  endColumn: string;
} {
  const indices = Object.values(layout.columns)
    .filter(Boolean)
    .map((column) => columnLetterToIndex(column!))
    .filter((index): index is number => index != null);

  if (indices.length === 0) {
    return { startColumn: "A", endColumn: "K" };
  }

  const min = Math.min(...indices);
  const max = Math.max(...indices);
  return {
    startColumn: indexToColumnLetter(min),
    endColumn: indexToColumnLetter(max),
  };
}

/** Read transaction rows from a mapped CC ledger tab. */
export async function readCcLedgerRows(
  spreadsheetId: string,
  tab: string,
  layout: SheetsLayoutConfig,
): Promise<CcLedgerSheetRow[]> {
  if (!(await tabExists(spreadsheetId, tab))) {
    throw new Error(`Tab "${tab}" was not found in your spreadsheet.`);
  }

  const { startColumn, endColumn } = mappedColumnRange(layout);
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tab}'!${startColumn}${layout.dataStartRow}:${endColumn}`,
  });

  const rows = response.data.values ?? [];
  const parsed: CcLedgerSheetRow[] = [];

  for (let index = 0; index < rows.length; index++) {
    const rowValues = rows[index] ?? [];
    const values: Partial<Record<CcLedgerFieldKey, string>> = {};
    let hasContent = false;

    for (const [field, column] of Object.entries(layout.columns) as Array<
      [CcLedgerFieldKey, string | undefined]
    >) {
      if (!column) continue;
      const columnIndex =
        columnLetterToIndex(column)! - columnLetterToIndex(startColumn)!;
      const cell = String(rowValues[columnIndex] ?? "").trim();
      if (cell) hasContent = true;
      values[field] = cell;
    }

    if (!hasContent) continue;

    parsed.push({
      rowNumber: layout.dataStartRow + index,
      values,
    });
  }

  return parsed;
}

/** Read a few data rows below the header for LLM column mapping context. */
export async function readSampleDataRows(
  spreadsheetId: string,
  tab: string,
  layout: SheetsLayoutConfig,
  rowCount = 3,
  headerCount?: number,
): Promise<string[][]> {
  if (!(await tabExists(spreadsheetId, tab))) {
    return [];
  }

  const { endColumn: mappedEndColumn } = mappedColumnRange(layout);
  const endColumn =
    headerCount && headerCount > 0
      ? indexToColumnLetter(Math.max(headerCount - 1, 0))
      : mappedEndColumn;
  const startRow = layout.dataStartRow;
  const endRow = startRow + Math.max(rowCount - 1, 0);
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tab}'!A${startRow}:${endColumn}${endRow}`,
  });

  return (response.data.values ?? []).map((row) =>
    row.map((value) => String(value ?? "")),
  );
}

export function parseAgentStateToCcLedgerRow(
  state: Record<string, unknown>,
  sheetStatus: CcLedgerSheetStatus = "",
): CcLedgerRowInput {
  return {
    date: String(state.date ?? ""),
    merchant: String(state.vendor ?? state.merchant ?? "Unknown"),
    amount: Number(state.amount ?? 0),
    category: String(state.final_category ?? state.category ?? "other"),
    billableStatus: String(state.billable_status ?? "review"),
    billableReason: String(state.billable_reason ?? ""),
    workOrderNumber:
      typeof state.work_order_number === "string"
        ? state.work_order_number
        : null,
    cardLastFour:
      typeof state.card_last_four === "string" ? state.card_last_four : null,
    sheetStatus,
    reconciled: Boolean(state.credit_card_reconciled),
    expenseId: String(state.expense_id ?? ""),
  };
}
