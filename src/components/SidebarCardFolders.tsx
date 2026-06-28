"use client";

import { useMemo, useState } from "react";
import type { Expense } from "@/lib/types";
import {
  groupExpensesByCard,
  groupExpensesByMonth,
  type ExpenseGroup,
} from "@/lib/expense-grouping";
import { IconChevronDown, IconReceipt } from "./icons";
import { formatCurrency, formatDate } from "@/lib/categories";
import { CategoryBadge } from "./CategoryBadge";
import { BillableBadge } from "./BillableBadge";
import { CardBadge } from "./CardBadge";

interface SidebarCardFoldersProps {
  expenses: Expense[];
}

function CardReceiptItem({ expense }: { expense: Expense }) {
  return (
    <li className="border-b border-qb-border-light px-5 py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-semibold text-qb-text">
          {expense.merchant}
        </p>
        <p className="shrink-0 text-sm font-bold tabular-nums text-qb-text">
          {formatCurrency(expense.amount)}
        </p>
      </div>
      <p className="mt-1 text-[11px] text-qb-text-muted">
        {formatDate(expense.date)}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <CategoryBadge category={expense.category} />
        <BillableBadge status={expense.billableStatus} />
        <CardBadge
          lastFour={expense.cardLastFour}
          brand={expense.cardBrand}
        />
      </div>
    </li>
  );
}

function CardMonthFolder({ monthGroup }: { monthGroup: ExpenseGroup }) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="border-b border-qb-border-light last:border-b-0">
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex w-full items-center gap-2 bg-qb-bg/20 py-2.5 pl-8 pr-5 text-left transition hover:bg-qb-bg/50"
      >
        <IconChevronDown
          className={`h-3 w-3 shrink-0 text-qb-text-muted transition-transform ${
            collapsed ? "-rotate-90" : ""
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-qb-text">
            {monthGroup.label}
          </p>
          <p className="text-[11px] text-qb-text-muted">
            {monthGroup.expenses.length} receipt
            {monthGroup.expenses.length === 1 ? "" : "s"}
          </p>
        </div>
        <p className="shrink-0 text-xs font-bold tabular-nums text-qb-text">
          {formatCurrency(monthGroup.total)}
        </p>
      </button>

      {!collapsed && (
        <ul className="border-t border-qb-border-light bg-qb-bg/30">
          {monthGroup.expenses.map((expense) => (
            <CardReceiptItem key={expense.id} expense={expense} />
          ))}
        </ul>
      )}
    </div>
  );
}

function CardFolderGroup({ group }: { group: ExpenseGroup }) {
  const [collapsed, setCollapsed] = useState(true);
  const monthGroups = useMemo(
    () => groupExpensesByMonth(group.expenses),
    [group.expenses],
  );

  return (
    <div className="border-b border-qb-border-light last:border-b-0">
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex w-full items-center gap-2 px-5 py-3 text-left transition hover:bg-qb-bg/60"
      >
        <IconChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-qb-text-muted transition-transform ${
            collapsed ? "-rotate-90" : ""
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold tabular-nums text-qb-text">
            {group.label}
          </p>
          <p className="text-[11px] text-qb-text-muted">
            {group.expenses.length} receipt
            {group.expenses.length === 1 ? "" : "s"}
            {monthGroups.length > 0 && (
              <span>
                {" "}
                · {monthGroups.length} month
                {monthGroups.length === 1 ? "" : "s"}
              </span>
            )}
          </p>
        </div>
        <p className="shrink-0 text-xs font-bold tabular-nums text-qb-text">
          {formatCurrency(group.total)}
        </p>
      </button>

      {!collapsed && (
        <div className="border-t border-qb-border-light bg-qb-bg/30">
          {monthGroups.map((monthGroup) => (
            <CardMonthFolder key={monthGroup.key} monthGroup={monthGroup} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarCardFolders({ expenses }: SidebarCardFoldersProps) {
  const groups = useMemo(() => groupExpensesByCard(expenses), [expenses]);

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center px-5 py-10 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-qb-bg">
          <IconReceipt className="h-6 w-6 text-qb-text-muted" />
        </div>
        <p className="text-sm font-semibold text-qb-text-secondary">
          No card folders yet
        </p>
        <p className="mt-1 text-xs leading-relaxed text-qb-text-muted">
          Scan receipts with a card number to build folders here
        </p>
      </div>
    );
  }

  return (
    <div>
      {groups.map((group) => (
        <CardFolderGroup key={group.key} group={group} />
      ))}
    </div>
  );
}
