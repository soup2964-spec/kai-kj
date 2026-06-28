"use client";

import { useState } from "react";
import type { Expense } from "@/lib/types";
import { CategoryBadge } from "./CategoryBadge";
import { BillableBadge } from "./BillableBadge";
import { ReceiptLineItemsList } from "./ReceiptLineItemsList";
import {
  IconChevronDown,
  IconExpenses,
  IconReceipt,
  IconTrash,
} from "./icons";
import { formatCurrency, formatDate } from "@/lib/categories";

interface ExpenseListProps {
  expenses: Expense[];
  onRemove: (id: string) => void;
}

function ExpenseRow({
  expense,
  expanded,
  onToggle,
  onRemove,
}: {
  expense: Expense;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const hasLineItems = expense.lineItems.length > 0;

  return (
    <li className="group">
      <div
        className={`flex items-center gap-3 px-4 py-3.5 lg:px-5 ${
          expanded ? "bg-qb-bg/50" : "lg:hover:bg-qb-bg/40"
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={`expense-items-${expense.id}`}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left active:opacity-80"
        >
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

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-qb-text">
                {expense.merchant}
              </p>
              <IconChevronDown
                className={`h-4 w-4 shrink-0 text-qb-text-muted transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </div>
            <p className="text-xs text-qb-text-muted">
              {formatDate(expense.date)}
              {hasLineItems && !expanded && (
                <span className="ml-1.5 text-qb-text-secondary">
                  · {expense.lineItems.length} item
                  {expense.lineItems.length === 1 ? "" : "s"}
                </span>
              )}
              {!expanded && (
                <span className="ml-1.5 text-qb-text-secondary">
                  · tap for details
                </span>
              )}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <CategoryBadge category={expense.category} />
              <BillableBadge status={expense.billableStatus} />
            </div>
          </div>

          <p className="shrink-0 text-sm font-bold tabular-nums text-qb-text">
            {formatCurrency(expense.amount)}
          </p>
        </button>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${expense.merchant}`}
          className="qb-btn-ghost shrink-0 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
        >
          <IconTrash />
        </button>
      </div>

      {expanded && (
        <div
          id={`expense-items-${expense.id}`}
          className="border-t border-qb-border-light bg-qb-bg/30 px-4 py-3 lg:px-5 qb-animate-in space-y-3"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
              Billable
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <BillableBadge status={expense.billableStatus} size="md" />
              <span className="text-xs text-qb-text-secondary">
                {expense.billableReason}
              </span>
            </div>
          </div>

          {hasLineItems ? (
            <ReceiptLineItemsList items={expense.lineItems} />
          ) : (
            <p className="text-sm text-qb-text-muted">
              No line items saved for this receipt.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export function ExpenseList({ expenses, onRemove }: ExpenseListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (expenses.length === 0) {
    return (
      <section className="qb-card">
        <div className="flex flex-col items-center px-5 py-10 text-center lg:px-6 lg:py-12">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-qb-bg">
            <IconExpenses className="h-7 w-7 text-qb-text-muted" />
          </div>
          <p className="font-semibold text-qb-text">No expenses recorded</p>
          <p className="mt-1 max-w-xs text-sm text-qb-text-secondary">
            Scan your first receipt above — tap a transaction to view line
            items.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="qb-card overflow-hidden">
      <div className="qb-card-header flex items-center justify-between py-3 lg:py-4">
        <div className="flex items-center gap-2.5">
          <IconExpenses className="h-4 w-4 text-qb-blue" />
          <h2 className="text-base font-bold text-qb-text lg:text-lg">
            Transactions
          </h2>
        </div>
        <span className="rounded bg-qb-bg px-2 py-0.5 text-xs font-semibold tabular-nums text-qb-text-secondary">
          {expenses.length}
        </span>
      </div>

      <p className="border-b border-qb-border-light px-4 py-2 text-xs text-qb-text-muted lg:px-5">
        Tap a transaction to view receipt line items
      </p>

      <ul className="divide-y divide-qb-border-light">
        {expenses.map((expense) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            expanded={expandedId === expense.id}
            onToggle={() =>
              setExpandedId((current) =>
                current === expense.id ? null : expense.id,
              )
            }
            onRemove={() => {
              if (expandedId === expense.id) setExpandedId(null);
              onRemove(expense.id);
            }}
          />
        ))}
      </ul>
    </section>
  );
}
