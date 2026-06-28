"use client";

import { useState } from "react";
import type { ExpenseDateSort } from "@/lib/expense-grouping";
import { sortExpensesByDate } from "@/lib/expense-grouping";
import { downloadExpensesCsv } from "@/lib/expense-spreadsheet";
import { exportToGoogleSheetsRemote } from "@/lib/expense-sync";
import type { Expense } from "@/lib/types";

type ExpenseExportButtonProps = {
  expenses: Expense[];
  dateSort?: ExpenseDateSort;
  className?: string;
};

export function ExpenseExportButton({
  expenses,
  dateSort = "newest",
  className = "",
}: ExpenseExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const disabled = exporting || expenses.length === 0;
  const sortedExpenses = sortExpensesByDate(expenses, dateSort);

  async function handleExport() {
    if (expenses.length === 0) return;

    setExporting(true);
    setExportMessage(null);

    try {
      const result = await exportToGoogleSheetsRemote(dateSort);

      if (result.fallback === "csv") {
        downloadExpensesCsv(sortedExpenses);
        setExportMessage(
          "Downloaded CSV. In Google Sheets, use File → Import → Upload to open it.",
        );
        return;
      }

      window.open(result.spreadsheetUrl, "_blank", "noopener,noreferrer");
      setExportMessage("Google Sheet created and opened in a new tab.");
    } catch (error) {
      downloadExpensesCsv(sortedExpenses);
      setExportMessage(
        error instanceof Error
          ? `${error.message} Downloaded CSV instead — import it into Google Sheets.`
          : "Could not create a Google Sheet. Downloaded CSV instead.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-qb-text">Export receipts</p>
          <p className="mt-1 text-xs text-qb-text-secondary">
            {expenses.length === 0
              ? "Scan at least one receipt to export."
              : `Export ${expenses.length} receipt${expenses.length === 1 ? "" : "s"} to Google Sheets.`}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            void handleExport();
          }}
          className="qb-btn-primary qb-btn-compact w-full sm:w-auto"
        >
          {exporting ? "Exporting..." : "Export to Google Sheets"}
        </button>
      </div>
      {exportMessage ? (
        <p className="mt-3 rounded-lg border border-qb-blue/20 bg-qb-blue-light px-3 py-2 text-xs text-qb-blue-dark">
          {exportMessage}
        </p>
      ) : null}
    </div>
  );
}
