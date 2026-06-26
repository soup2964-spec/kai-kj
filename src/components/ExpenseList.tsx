"use client";

import type { Expense } from "@/lib/types";
import { CategoryBadge } from "./CategoryBadge";
import { IconExpenses, IconReceipt, IconTrash } from "./icons";
import { formatCurrency, formatDate } from "@/lib/categories";

interface ExpenseListProps {
  expenses: Expense[];
  onRemove: (id: string) => void;
}

export function ExpenseList({ expenses, onRemove }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <section className="qb-card">
        <div className="flex flex-col items-center px-5 py-10 text-center lg:px-6 lg:py-12">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-qb-bg">
            <IconExpenses className="h-7 w-7 text-qb-text-muted" />
          </div>
          <p className="font-semibold text-qb-text">No expenses recorded</p>
          <p className="mt-1 max-w-xs text-sm text-qb-text-secondary">
            Scan your first receipt above — it&apos;ll show up here and in the
            live feed.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="qb-card overflow-hidden">
      <div className="qb-card-header flex items-center justify-between py-3 lg:py-4">
        <div className="flex items-center gap-2.5">
          <IconExpenses className="h-4 w-4 text-qb-green" />
          <h2 className="text-base font-bold text-qb-text lg:text-lg">
            Transactions
          </h2>
        </div>
        <span className="rounded bg-qb-bg px-2 py-0.5 text-xs font-semibold tabular-nums text-qb-text-secondary">
          {expenses.length}
        </span>
      </div>

      <div className="hidden border-b border-qb-border-light bg-qb-bg/50 px-5 py-2 lg:grid lg:grid-cols-[1fr_120px_120px_40px] lg:gap-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
          Vendor
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
          Category
        </span>
        <span className="text-right text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
          Amount
        </span>
        <span />
      </div>

      <ul className="divide-y divide-qb-border-light">
        {expenses.map((expense) => (
          <li
            key={expense.id}
            className="group px-4 py-3.5 active:bg-qb-bg/60 lg:grid lg:grid-cols-[1fr_120px_120px_40px] lg:items-center lg:gap-4 lg:px-5 lg:hover:bg-qb-bg/40"
          >
            {/* Mobile: compact card row */}
            <div className="flex items-center gap-3 lg:contents">
              {expense.receiptImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={expense.receiptImage}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded border border-qb-border object-cover lg:h-10 lg:w-10"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-qb-border bg-qb-bg lg:h-10 lg:w-10">
                  <IconReceipt className="h-4 w-4 text-qb-text-muted" />
                </div>
              )}

              <div className="min-w-0 flex-1 lg:block">
                <p className="truncate text-sm font-semibold text-qb-text">
                  {expense.merchant}
                </p>
                <p className="text-xs text-qb-text-muted lg:mt-0">
                  {formatDate(expense.date)}
                </p>
                <div className="mt-1.5 lg:hidden">
                  <CategoryBadge category={expense.category} />
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1 lg:contents">
                <p className="text-sm font-bold tabular-nums text-qb-text">
                  {formatCurrency(expense.amount)}
                </p>
                <button
                  type="button"
                  onClick={() => onRemove(expense.id)}
                  aria-label={`Remove ${expense.merchant}`}
                  className="qb-btn-ghost -mr-1 lg:justify-self-end lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
                >
                  <IconTrash />
                </button>
              </div>
            </div>

            <div className="hidden lg:block">
              <CategoryBadge category={expense.category} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
