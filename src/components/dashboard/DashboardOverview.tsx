"use client";

import Link from "next/link";
import { ExpenseList } from "@/components/ExpenseList";
import { SummaryBar } from "@/components/SummaryBar";
import {
  DASHBOARD_NAV,
  isDashboardNavActive,
} from "@/components/dashboard/dashboard-nav";
import { useExpenseContext } from "@/lib/expense-context";
import { usePathname } from "next/navigation";

export function DashboardOverview() {
  const pathname = usePathname();
  const { expenses, removeExpense, updateExpense } = useExpenseContext();
  const recentExpenses = expenses.slice(0, 5);

  return (
    <>
      <section className="qb-card">
        <div className="qb-card-header">
          <h2 className="text-base font-bold text-qb-text">Quick actions</h2>
          <p className="mt-1 text-sm text-qb-text-secondary">
            Jump into a workflow or review your latest activity.
          </p>
        </div>
        <div className="qb-card-body grid gap-3 sm:grid-cols-2">
          {DASHBOARD_NAV.filter((item) => item.href !== "/dashboard").map(
            (item) => {
              const Icon = item.icon;
              const active = isDashboardNavActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`dashboard-menu-card ${active ? "dashboard-menu-card-active" : ""}`}
                >
                  <span className="dashboard-menu-card-icon">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-qb-text">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-qb-text-secondary">
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            },
          )}
        </div>
      </section>

      <SummaryBar expenses={expenses} />

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
