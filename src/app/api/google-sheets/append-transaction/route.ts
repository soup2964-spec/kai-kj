import { NextResponse } from "next/server";
import { apiErrorMessage } from "@/lib/expense-api";
import {
  appendCcTransactionToLedger,
  ccTabName,
  findCcLedgerRowByExpenseId,
  isCcLedgerConfigured,
  parseAgentStateToCcLedgerRow,
  replaceCcLedgerRow,
  updateCcLedgerRowStatus,
  type CcLedgerSheetStatus,
} from "@/lib/google-sheets-ledger";
import {
  resolveCcLedgerLayout,
  resolveCcLedgerSpreadsheetId,
} from "@/lib/resolve-cc-ledger";

type LedgerAction = "append" | "update_status" | "replace";

function parseSheetStatus(value: unknown): CcLedgerSheetStatus {
  if (value === "ORANGE" || value === "GREEN") return value;
  return "";
}

function parseOwnerIdFromBody(body: Record<string, unknown>): string | null {
  const raw = body.ownerId ?? body.owner_id;
  if (typeof raw !== "string" || !raw.trim()) return null;
  return raw.trim();
}

export async function POST(request: Request) {
  try {
    if (!isCcLedgerConfigured()) {
      return NextResponse.json(
        {
          error:
            "Google Sheets is not configured on this deployment. Set GOOGLE_SERVICE_ACCOUNT_JSON.",
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    const ownerId = parseOwnerIdFromBody(body);

    let spreadsheetId: string;
    let layout;
    try {
      spreadsheetId = await resolveCcLedgerSpreadsheetId(ownerId);
      layout = await resolveCcLedgerLayout(ownerId);
    } catch (error) {
      return NextResponse.json(
        {
          error: apiErrorMessage(
            error,
            "Connect your CC ledger spreadsheet and column mapping in Agent settings before the agent can write transactions.",
          ),
        },
        { status: 503 },
      );
    }

    const action = (body.action as LedgerAction) ?? "append";
    const cardLastFour = body.cardLastFour ?? body.card_last_four;
    const tab =
      typeof body.tab === "string" && body.tab.trim()
        ? body.tab.trim()
        : ccTabName(
            typeof cardLastFour === "string" ? cardLastFour : null,
            layout,
          );

    if (action === "update_status") {
      const expenseId = String(body.expenseId ?? body.expense_id ?? "");
      let rowNumber = Number(body.rowNumber ?? body.row_number ?? 0);

      if (!rowNumber && expenseId) {
        const found = await findCcLedgerRowByExpenseId(
          spreadsheetId,
          tab,
          expenseId,
          layout,
        );
        rowNumber = found ?? 0;
      }

      if (!rowNumber) {
        return NextResponse.json(
          { error: "Could not find ledger row to update." },
          { status: 404 },
        );
      }

      await updateCcLedgerRowStatus(
        spreadsheetId,
        tab,
        rowNumber,
        layout,
        {
          sheetStatus: parseSheetStatus(body.sheetStatus ?? body.status),
          reconciled:
            body.reconciled === true || body.reconciled === "true"
              ? true
              : body.reconciled === false || body.reconciled === "false"
                ? false
                : undefined,
        },
      );

      return NextResponse.json({
        tab,
        rowNumber,
        spreadsheetId,
        updated: true,
      });
    }

    if (action === "replace") {
      const expenseId = String(body.expenseId ?? body.expense_id ?? "");
      let rowNumber = Number(body.rowNumber ?? body.row_number ?? 0);

      if (!rowNumber && expenseId) {
        const found = await findCcLedgerRowByExpenseId(
          spreadsheetId,
          tab,
          expenseId,
          layout,
        );
        rowNumber = found ?? 0;
      }

      if (!rowNumber) {
        return NextResponse.json(
          { error: "Could not find ledger row to replace." },
          { status: 404 },
        );
      }

      const row = parseAgentStateToCcLedgerRow(
        body.row ? { ...body.row, expense_id: expenseId } : body,
        parseSheetStatus(body.sheetStatus ?? body.status),
      );

      await replaceCcLedgerRow(spreadsheetId, tab, rowNumber, layout, row);

      return NextResponse.json({
        tab,
        rowNumber,
        spreadsheetId,
        replaced: true,
      });
    }

    const row = body.row
      ? parseAgentStateToCcLedgerRow(
          { ...body.row, expense_id: body.expenseId ?? body.row.expense_id },
          parseSheetStatus(body.sheetStatus ?? body.status ?? body.row.status),
        )
      : parseAgentStateToCcLedgerRow(body, parseSheetStatus(body.sheetStatus ?? body.status));

    const result = await appendCcTransactionToLedger(
      spreadsheetId,
      row,
      layout,
      tab,
    );

    return NextResponse.json({
      rowId: result.range,
      rowNumber: result.rowNumber,
      tab: result.tab,
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: apiErrorMessage(error, "Could not write CC transaction to Google Sheets."),
      },
      { status: 500 },
    );
  }
}
