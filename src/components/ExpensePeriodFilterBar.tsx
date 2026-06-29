"use client";

import type { Expense } from "@/lib/types";
import {
  clampDayToPeriod,
  DATE_SORT_LABELS,
  DEFAULT_EXPENSE_PERIOD_FILTER,
  filterExpensesByPeriod,
  formatPeriodLabel,
  getDayOptions,
  getExpenseYears,
  MONTH_FILTER_OPTIONS,
  parseDateInputValue,
  periodToDateInputValue,
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

function updatePeriod(
  current: ExpensePeriodFilter,
  patch: Partial<ExpensePeriodFilter>,
): ExpensePeriodFilter {
  return clampDayToPeriod({ ...current, ...patch });
}

export function ExpensePeriodFilterBar({
  expenses,
  period,
  dateSort,
  onPeriodChange,
  onDateSortChange,
}: ExpensePeriodFilterBarProps) {
  const years = getExpenseYears(expenses);
  const dayOptions = getDayOptions(period.month, period.year);
  const filteredCount = filterExpensesByPeriod(expenses, period).length;
  const dateInputValue = periodToDateInputValue(period);
  const hasActiveFilter =
    period.month !== "all" || period.day !== "all" || period.year !== "all";

  return (
    <section className="qb-card">
      <div className="qb-card-body flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-qb-text">
            Filter by month, day, and year
          </p>
          <p className="mt-1 text-xs text-qb-text-secondary">
            Showing {filteredCount} receipt{filteredCount === 1 ? "" : "s"} for{" "}
            {formatPeriodLabel(period)}.
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
            Pick a date
          </span>
          <input
            type="date"
            value={dateInputValue}
            onChange={(event) => {
              const next = parseDateInputValue(event.target.value);
              if (next) {
                onPeriodChange(next);
                return;
              }

              if (!event.target.value) {
                onPeriodChange(DEFAULT_EXPENSE_PERIOD_FILTER);
              }
            }}
            className="rounded border border-qb-border bg-qb-surface px-3 py-2 text-sm text-qb-text"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
              Month
            </span>
            <select
              value={period.month === "all" ? "all" : String(period.month)}
              onChange={(event) => {
                const value = event.target.value;
                onPeriodChange(
                  updatePeriod(period, {
                    month: value === "all" ? "all" : Number(value),
                  }),
                );
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
              Day
            </span>
            <select
              value={period.day === "all" ? "all" : String(period.day)}
              onChange={(event) => {
                const value = event.target.value;
                onPeriodChange(
                  updatePeriod(period, {
                    day: value === "all" ? "all" : Number(value),
                  }),
                );
              }}
              className="rounded border border-qb-border bg-qb-surface px-3 py-2 text-sm text-qb-text"
            >
              <option value="all">All days</option>
              {dayOptions.map((day) => (
                <option key={day} value={String(day)}>
                  {day}
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
                onPeriodChange(
                  updatePeriod(period, {
                    year: value === "all" ? "all" : Number(value),
                  }),
                );
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
            Sort order
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
          {hasActiveFilter ? (
            <button
              type="button"
              onClick={() => onPeriodChange(DEFAULT_EXPENSE_PERIOD_FILTER)}
              className="rounded-full border border-qb-border bg-qb-surface px-3 py-1.5 text-xs font-semibold text-qb-text-secondary hover:bg-qb-bg"
            >
              Clear date filter
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export { DEFAULT_EXPENSE_PERIOD_FILTER };
