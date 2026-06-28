"use client";

import type { Expense } from "@/lib/types";
import {
  DATE_SORT_LABELS,
  DEFAULT_EXPENSE_PERIOD_FILTER,
  filterExpensesByPeriod,
  formatPeriodLabel,
  getExpenseYears,
  MONTH_FILTER_OPTIONS,
  type ExpenseDateSort,
  type ExpensePeriodFilter,
} from "@/lib/expense-grouping";

type ExpensePeriodFilterBarProps = {
  expenses: Expense[];
  period: ExpensePeriodFilter;
  dateSort: ExpenseDateSort;
  onPeriodChange: (period: ExpensePeriodFilter) => void;
  onDateSortChange: (sort: ExpenseDateSort) => void;
};

export function ExpensePeriodFilterBar({
  expenses,
  period,
  dateSort,
  onPeriodChange,
  onDateSortChange,
}: ExpensePeriodFilterBarProps) {
  const years = getExpenseYears(expenses);
  const filteredCount = filterExpensesByPeriod(expenses, period).length;

  return (
    <section className="qb-card">
      <div className="qb-card-body flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-qb-text">Sort by month and year</p>
          <p className="mt-1 text-xs text-qb-text-secondary">
            Showing {filteredCount} receipt{filteredCount === 1 ? "" : "s"} for{" "}
            {formatPeriodLabel(period)}.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
              Month
            </span>
            <select
              value={period.month === "all" ? "all" : String(period.month)}
              onChange={(event) => {
                const value = event.target.value;
                onPeriodChange({
                  ...period,
                  month: value === "all" ? "all" : Number(value),
                });
              }}
              className="rounded border border-qb-border bg-qb-surface px-3 py-2 text-sm text-qb-text"
            >
              {MONTH_FILTER_OPTIONS.map((option) => (
                <option
                  key={String(option.value)}
                  value={option.value === "all" ? "all" : String(option.value)}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
              Year
            </span>
            <select
              value={period.year === "all" ? "all" : String(period.year)}
              onChange={(event) => {
                const value = event.target.value;
                onPeriodChange({
                  ...period,
                  year: value === "all" ? "all" : Number(value),
                });
              }}
              className="rounded border border-qb-border bg-qb-surface px-3 py-2 text-sm text-qb-text"
            >
              <option value="all">All years</option>
              {years.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-qb-text-secondary">
            Order
          </span>
          {(Object.keys(DATE_SORT_LABELS) as ExpenseDateSort[]).map((sort) => (
            <button
              key={sort}
              type="button"
              aria-pressed={dateSort === sort}
              onClick={() => onDateSortChange(sort)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                dateSort === sort
                  ? "bg-qb-blue-dark text-white"
                  : "border border-qb-border bg-qb-surface text-qb-text-secondary hover:bg-qb-bg"
              }`}
            >
              {DATE_SORT_LABELS[sort]}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export { DEFAULT_EXPENSE_PERIOD_FILTER };
