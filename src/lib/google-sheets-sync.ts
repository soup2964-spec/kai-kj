import type { CcLedgerSheetStatus } from "@/lib/cc-ledger-types";
import {
  ccLedgerRowToExpense,
  expenseToCcLedgerRow,
} from "@/lib/expense-ledger-row";
import type { Expense } from "@/lib/types";
import {
  appendCcTransactionToLedger,
  ccTabName,
  findCcLedgerRowByExpenseId,
  isCcLedgerConfigured,
  readCcLedgerRows,
  replaceCcLedgerRow,
  type CcLedgerSheetRow,
} from "@/lib/google-sheets-ledger";
import {
  resolveCcLedgerLayout,
  resolveCcLedgerSpreadsheetId,
} from "@/lib/resolve-cc-ledger";
import type { CcLedgerFieldKey } from "@/lib/sheets-layout";

export interface SheetSyncResult {
  spreadsheetId: string;
  tab: string;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

function sheetRowValues(row: CcLedgerSheetRow): Partial<Record<CcLedgerFieldKey, string>> {
  return row.values as Partial<Record<CcLedgerFieldKey, string>>;
}

function sheetStatusFromExpense(expense: Expense): CcLedgerSheetStatus {
  if (expense.inboxStatus === "needs_review") return "ORANGE";
  if (expense.inboxStatus === "reconciled" || expense.creditCardReconciled) {
    return "GREEN";
  }
  return "";
}

export async function pushExpenseToSheet(
  ownerId: string,
  expense: Expense,
): Promise<{ tab: string; rowNumber: number; action: "append" | "replace" } | null> {
  if (!isCcLedgerConfigured()) return null;

  const spreadsheetId = await resolveCcLedgerSpreadsheetId(ownerId);
  const layout = await resolveCcLedgerLayout(ownerId);
  const tab = ccTabName(expense.cardLastFour, layout);
  const row = expenseToCcLedgerRow(expense, sheetStatusFromExpense(expense));

  const existingRow = await findCcLedgerRowByExpenseId(
    spreadsheetId,
    tab,
    expense.id,
    layout,
  );

  if (existingRow) {
    await replaceCcLedgerRow(spreadsheetId, tab, existingRow, layout, row);
    return { tab, rowNumber: existingRow, action: "replace" };
  }

  const result = await appendCcTransactionToLedger(
    spreadsheetId,
    row,
    layout,
    tab,
  );

  return { tab, rowNumber: result.rowNumber, action: "append" };
}

export async function pushExpensesToSheet(
  ownerId: string,
  expenses: Expense[],
): Promise<SheetSyncResult> {
  const spreadsheetId = await resolveCcLedgerSpreadsheetId(ownerId);
  const layout = await resolveCcLedgerLayout(ownerId);
  const tab = ccTabName(null, layout);

  const result: SheetSyncResult = {
    spreadsheetId,
    tab,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const expense of expenses) {
    try {
      const pushed = await pushExpenseToSheet(ownerId, expense);
      if (!pushed) {
        result.skipped += 1;
        continue;
      }
      if (pushed.action === "append") result.created += 1;
      else result.updated += 1;
    } catch (error) {
      result.errors.push(
        `${expense.merchant}: ${
          error instanceof Error ? error.message : "Could not sync row"
        }`,
      );
    }
  }

  return result;
}

export async function pullTransactionsFromSheet(
  ownerId: string,
  existingExpenses: Expense[],
  tabOverride?: string,
): Promise<{ expenses: Expense[]; result: SheetSyncResult }> {
  const spreadsheetId = await resolveCcLedgerSpreadsheetId(ownerId);
  const layout = await resolveCcLedgerLayout(ownerId);
  const tab = tabOverride?.trim() || ccTabName(null, layout);
  const rows = await readCcLedgerRows(spreadsheetId, tab, layout);

  const byId = new Map(existingExpenses.map((expense) => [expense.id, expense]));
  const result: SheetSyncResult = {
    spreadsheetId,
    tab,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const row of rows) {
    try {
      const values = sheetRowValues(row);
      const expenseId = values.expenseId?.trim();
      const imported = ccLedgerRowToExpense(values, {
        rowNumber: row.rowNumber,
        tab,
      });

      if (expenseId && byId.has(expenseId)) {
        const existing = byId.get(expenseId)!;
        byId.set(expenseId, {
          ...existing,
          ...imported,
          id: expenseId,
          receiptImage: existing.receiptImage,
          createdAt: existing.createdAt,
        });
        result.updated += 1;
      } else if (expenseId && !byId.has(expenseId)) {
        byId.set(expenseId, imported);
        result.created += 1;
      } else if (!expenseId) {
        byId.set(imported.id, imported);
        result.created += 1;
      } else {
        result.skipped += 1;
      }
    } catch (error) {
      result.errors.push(
        `Row ${row.rowNumber}: ${
          error instanceof Error ? error.message : "Could not import row"
        }`,
      );
    }
  }

  return { expenses: [...byId.values()], result };
}

export async function tryPushExpenseToSheet(
  ownerId: string,
  expense: Expense,
): Promise<void> {
  try {
    await pushExpenseToSheet(ownerId, expense);
  } catch {
    // Sheet sync is best-effort and should not block expense saves.
  }
}
