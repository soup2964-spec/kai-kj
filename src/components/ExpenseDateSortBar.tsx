"use client";

import {
  DATE_SORT_LABELS,
  type ExpenseDateSort,
} from "@/lib/expense-grouping";

type ExpenseDateSortBarProps = {
  value: ExpenseDateSort;
  onChange: (sort: ExpenseDateSort) => void;
};

export function ExpenseDateSortBar({ value, onChange }: ExpenseDateSortBarProps) {
  return (
    <section className="qb-card">
      <div className="qb-card-body flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-qb-text">Sort by date</p>
          <p className="mt-1 text-xs text-qb-text-secondary">
            Controls order for receipt folders and exports.
          </p>
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Sort expenses by date"
        >
          {(Object.keys(DATE_SORT_LABELS) as ExpenseDateSort[]).map((sort) => (
            <button
              key={sort}
              type="button"
              aria-pressed={value === sort}
              onClick={() => onChange(sort)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                value === sort
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
