"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Expense } from "@/lib/types";
import { CategoryBadge } from "./CategoryBadge";
import { BillableBadge } from "./BillableBadge";
import { IconDashboard, IconReceipt } from "./icons";
import {
  CATEGORY_META,
  formatCurrency,
  formatDate,
} from "@/lib/categories";

interface LiveDashboardProps {
  expenses: Expense[];
}

function formatScanTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function LiveDashboard({ expenses }: LiveDashboardProps) {
  const prevCountRef = useRef(expenses.length);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    if (expenses.length > prevCountRef.current && expenses[0]) {
      setHighlightId(expenses[0].id);
      const timer = setTimeout(() => setHighlightId(null), 2500);
      prevCountRef.current = expenses.length;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = expenses.length;
  }, [expenses]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const expense of expenses) {
      counts[expense.category] = (counts[expense.category] ?? 0) + 1;
    }
    return Object.entries(counts).sort(([, a], [, b]) => b - a);
  }, [expenses]);

  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

  return (
    <aside className="flex h-full w-full flex-col border-r border-qb-border bg-qb-surface">
      {/* Sidebar brand header */}
      <div className="bg-qb-blue-dark px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-white/15">
            <IconReceipt className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">KKP</p>
            <p className="text-[11px] text-white/70">Expense Tracker</p>
          </div>
        </div>
      </div>

      {/* Live feed header */}
      <div className="border-b border-qb-border-light px-5 py-4">
        <div className="flex items-center gap-2">
          <IconDashboard className="h-4 w-4 text-qb-blue" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-qb-text-secondary">
            Live Feed
          </h2>
          <span className="relative ml-auto flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-qb-blue opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-qb-blue" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <p className="text-2xl font-bold tabular-nums text-qb-text">
            {formatCurrency(total)}
          </p>
          <p className="text-xs font-medium text-qb-text-muted">
            {expenses.length} scan{expenses.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {categoryCounts.length > 0 && (
        <div className="border-b border-qb-border-light px-5 py-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-qb-text-muted">
            Expense Types
          </p>
          <div className="space-y-1.5">
            {categoryCounts.map(([category, count]) => {
              const meta =
                CATEGORY_META[category as keyof typeof CATEGORY_META];
              const pct = Math.round((count / expenses.length) * 100);
              return (
                <div key={category} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: meta.dot }}
                  />
                  <span className="flex-1 truncate text-xs font-medium text-qb-text">
                    {meta.label}
                  </span>
                  <span className="text-xs tabular-nums text-qb-text-muted">
                    {count} · {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-qb-bg">
              <IconReceipt className="h-6 w-6 text-qb-text-muted" />
            </div>
            <p className="text-sm font-semibold text-qb-text-secondary">
              No scans yet
            </p>
            <p className="mt-1 text-xs leading-relaxed text-qb-text-muted">
              Receipts appear here the moment you save them
            </p>
          </div>
        ) : (
          <ul>
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className={`border-b border-qb-border-light px-5 py-3.5 transition-colors duration-500 ${
                  highlightId === expense.id
                    ? "bg-qb-blue-light qb-animate-in"
                    : "hover:bg-qb-bg/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  {expense.receiptImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={expense.receiptImage}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded border border-qb-border object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-qb-border bg-qb-bg">
                      <IconReceipt className="h-4 w-4 text-qb-text-muted" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-qb-text">
                        {expense.merchant}
                      </p>
                      <p className="shrink-0 text-sm font-bold tabular-nums text-qb-text">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <CategoryBadge category={expense.category} />
                        <BillableBadge status={expense.billableStatus} />
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-qb-text-muted">
                        {formatScanTime(expense.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-qb-text-muted">
                      {formatDate(expense.date)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
