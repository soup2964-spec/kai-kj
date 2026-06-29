"use client";

import Link from "next/link";
import { ExpenseList } from "@/components/ExpenseList";
import { SummaryBar } from "@/components/SummaryBar";
import { useExpenseContext } from "@/lib/expense-context";
import { getOperationsMetrics } from "@/lib/receipt-workflow";

export function DashboardOverview() {
  const { expenses, removeExpense, updateExpense } = useExpenseContext();
  const recentExpenses = expenses.slice(0, 5);
  const metrics = getOperationsMetrics(expenses);

  return (
    <>
      <SummaryBar expenses={expenses} />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Uploaded today", metrics.receiptsUploadedToday],
          ["Missing work orders", metrics.missingWorkOrders],
          ["Missing info", metrics.missingInfo],
          ["Duplicates", metrics.duplicateReceipts],
          ["Unmatched transactions", metrics.unmatchedTransactions],
          ["Reconciliation complete", `${metrics.reconciliationCompletion}%`],
        ].map(([label, value]) => (
          <div key={label} className="qb-stat">
            <p className="qb-stat-label">{label}</p>
            <p className="qb-stat-value">{value}</p>
          </div>
        ))}
      </section>

      <section className="qb-card">
        <div className="qb-card-header flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-qb-text">Recent receipts</h2>
            <p className="mt-1 text-sm text-qb-text-secondary">
              Your latest scans appear here first.
            </p>
          </div>
          {expenses.length > 0 ? (
            <Link href="/dashboard/expenses" className="qb-btn-ghost text-sm">
              View all
            </Link>
          ) : null}
        </div>
        <div className="qb-card-body">
          {recentExpenses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-qb-border bg-qb-bg px-4 py-8 text-center">
              <p className="text-sm font-semibold text-qb-text-secondary">
                No receipts yet
              </p>
              <p className="mt-1 text-xs text-qb-text-muted">
                Scan your first receipt to populate this dashboard.
              </p>
              <Link
                href="/dashboard/scan"
                className="qb-btn-primary mt-4 inline-flex text-sm"
              >
                Scan receipts
              </Link>
            </div>
          ) : (
            <ExpenseList
              expenses={recentExpenses}
              onRemove={removeExpense}
              onUpdate={updateExpense}
            />
          )}
        </div>
      </section>
    </>
  );
}
