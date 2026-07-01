"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_EXPENSE_PERIOD_FILTER,
  ExpensePeriodFilterBar,
} from "@/components/ExpensePeriodFilterBar";
import { ExpenseList } from "@/components/ExpenseList";
import { SummaryBar } from "@/components/SummaryBar";
import { GoogleSheetsSetupBanner } from "@/components/dashboard/GoogleSheetsSetupBanner";
import { GoogleSheetsSyncPanel } from "@/components/dashboard/GoogleSheetsSyncPanel";
import { ManualTransactionForm } from "@/components/dashboard/ManualTransactionForm";
import { isGoogleSheetsSyncReady } from "@/lib/google-sheets-setup";
import { useGoogleSheetsIntegration } from "@/lib/integrations-store";
import {
  filterExpensesByPeriod,
  type ExpenseDateSort,
  type ExpensePeriodFilter,
} from "@/lib/expense-grouping";
import { useExpenseContext } from "@/lib/expense-context";
import {
  DEFAULT_RECEIPT_SEARCH_FILTERS,
  getOperationsMetrics,
  INBOX_STATUS_LABELS,
  INBOX_STATUS_ORDER,
  searchExpenses,
  type ReceiptSearchFilters,
} from "@/lib/receipt-workflow";

function ReceiptInboxControls({
  filters,
  onChange,
  visibleCount,
  totalCount,
}: {
  filters: ReceiptSearchFilters;
  onChange: (filters: ReceiptSearchFilters) => void;
  visibleCount: number;
  totalCount: number;
}) {
  return (
    <section className="qb-card">
      <div className="qb-card-header">
        <h2 className="text-base font-bold text-qb-text">Receipt inbox</h2>
        <p className="mt-1 text-sm text-qb-text-secondary">
          Search and review receipts before export or reconciliation.
        </p>
      </div>
      <div className="qb-card-body space-y-3">
        <input
          type="search"
          value={filters.query}
          onChange={(event) =>
            onChange({ ...filters, query: event.target.value })
          }
          placeholder="Search merchant, amount, date, category, property, work order, vendor..."
          className="w-full rounded border border-qb-border bg-qb-surface px-3 py-2 text-sm text-qb-text"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
              Status
            </span>
            <select
              value={filters.inboxStatus}
              onChange={(event) =>
                onChange({
                  ...filters,
                  inboxStatus: event.target
                    .value as ReceiptSearchFilters["inboxStatus"],
                })
              }
              className="mt-1.5 w-full rounded border border-qb-border bg-qb-surface px-3 py-2 text-sm text-qb-text"
            >
              <option value="all">All statuses</option>
              {INBOX_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {INBOX_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 rounded border border-qb-border bg-qb-surface px-3 py-2 text-sm font-semibold text-qb-text-secondary">
            <input
              type="checkbox"
              checked={filters.onlyMissingInfo}
              onChange={(event) =>
                onChange({
                  ...filters,
                  onlyMissingInfo: event.target.checked,
                })
              }
            />
            Missing info only
          </label>

          <label className="flex items-center gap-2 rounded border border-qb-border bg-qb-surface px-3 py-2 text-sm font-semibold text-qb-text-secondary">
            <input
              type="checkbox"
              checked={filters.onlyDuplicates}
              onChange={(event) =>
                onChange({
                  ...filters,
                  onlyDuplicates: event.target.checked,
                })
              }
            />
            Duplicates only
          </label>
        </div>
        <p className="text-xs text-qb-text-muted">
          Showing {visibleCount} of {totalCount} receipt
          {totalCount === 1 ? "" : "s"}.
        </p>
      </div>
    </section>
  );
}

function OperationsDashboard({ expenses }: { expenses: ReturnType<typeof searchExpenses> }) {
  const metrics = getOperationsMetrics(expenses);
  const cards = [
    ["Uploaded today", metrics.receiptsUploadedToday],
    ["Needs review", metrics.needsReview],
    ["Missing info", metrics.missingInfo],
    ["Duplicate flags", metrics.duplicateReceipts],
    ["Unmatched", metrics.unmatchedTransactions],
    ["Reconciled", `${metrics.reconciliationCompletion}%`],
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(([label, value]) => (
        <div key={label} className="qb-stat">
          <p className="qb-stat-label">{label}</p>
          <p className="qb-stat-value">{value}</p>
        </div>
      ))}
    </section>
  );
}

export function ExpensesPage() {
  const { expenses, removeExpense, updateExpense } = useExpenseContext();
  const { status, loaded: sheetsLoaded } = useGoogleSheetsIntegration();
  const [dateSort, setDateSort] = useState<ExpenseDateSort>("newest");
  const [period, setPeriod] = useState<ExpensePeriodFilter>(
    DEFAULT_EXPENSE_PERIOD_FILTER,
  );
  const [filters, setFilters] = useState<ReceiptSearchFilters>(
    DEFAULT_RECEIPT_SEARCH_FILTERS,
  );

  const periodFilteredExpenses = useMemo(
    () => filterExpensesByPeriod(expenses, period),
    [expenses, period],
  );

  const filteredExpenses = useMemo(
    () => searchExpenses(periodFilteredExpenses, filters),
    [periodFilteredExpenses, filters],
  );

  return (
    <>
      {sheetsLoaded && !isGoogleSheetsSyncReady(status) ? (
        <GoogleSheetsSetupBanner />
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <ManualTransactionForm />
        <GoogleSheetsSyncPanel />
      </div>
      <ExpensePeriodFilterBar
        expenses={expenses}
        period={period}
        dateSort={dateSort}
        onPeriodChange={setPeriod}
        onDateSortChange={setDateSort}
      />
      <ReceiptInboxControls
        filters={filters}
        onChange={setFilters}
        visibleCount={filteredExpenses.length}
        totalCount={periodFilteredExpenses.length}
      />
      <OperationsDashboard expenses={filteredExpenses} />
      <SummaryBar expenses={filteredExpenses} />
      <ExpenseList
        expenses={filteredExpenses}
        dateSort={dateSort}
        onDateSortChange={setDateSort}
        onRemove={removeExpense}
        onUpdate={updateExpense}
      />
    </>
  );
}
