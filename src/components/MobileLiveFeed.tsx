"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Expense } from "@/lib/types";
import { CategoryBadge } from "./CategoryBadge";
import { BillableBadge } from "./BillableBadge";
import { formatCurrency } from "@/lib/categories";

interface MobileLiveFeedProps {
  expenses: Expense[];
}

export function MobileLiveFeed({ expenses }: MobileLiveFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(expenses.length);

  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

  useEffect(() => {
    if (expenses.length > prevCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
    prevCountRef.current = expenses.length;
  }, [expenses.length]);

  return (
    <section className="border-b border-qb-border bg-qb-surface lg:hidden">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-qb-blue opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-qb-blue" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-qb-text-secondary">
            Live
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold tabular-nums text-qb-text">
            {formatCurrency(total)}
          </p>
          <p className="text-[10px] text-qb-text-muted">
            {expenses.length} scan{expenses.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <p className="px-4 pb-3 text-xs text-qb-text-muted">
          Scans appear here instantly
        </p>
      ) : (
        <div
          ref={scrollRef}
          className="ios-scroll-x flex gap-2.5 overflow-x-auto px-4 pb-3"
        >
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="w-[148px] shrink-0 rounded-lg border border-qb-border bg-qb-bg p-2.5"
            >
              <div className="flex items-start gap-2">
                {expense.receiptImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={expense.receiptImage}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded border border-qb-border object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-qb-border bg-white text-xs">
                    🧾
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-qb-text">
                    {expense.merchant}
                  </p>
                  <p className="text-xs font-bold tabular-nums text-qb-text">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <CategoryBadge category={expense.category} />
                <BillableBadge status={expense.billableStatus} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
