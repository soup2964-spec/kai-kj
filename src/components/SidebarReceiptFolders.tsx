"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Expense } from "@/lib/types";
import {
  groupExpenses,
  groupExpensesByCard,
  groupExpensesByMonth,
  type ExpenseGroup,
  type ExpenseGroupMode,
} from "@/lib/expense-grouping";
import { IconChevronDown, IconExpenses, IconReceipt } from "./icons";
import { formatCurrency, formatDate } from "@/lib/categories";

type SidebarFolderMode = ExpenseGroupMode | "card";

const SIDEBAR_FOLDER_MODES: SidebarFolderMode[] = [
  "month",
  "card",
  "billable",
  "date",
  "workorder",
];

const SIDEBAR_FOLDER_LABELS: Record<SidebarFolderMode, string> = {
  month: "Month",
  card: "Cards",
  billable: "Billable",
  date: "Date",
  workorder: "Work order",
};

function useFolderGroups(
  expenses: Expense[],
  mode: SidebarFolderMode,
): ExpenseGroup[] {
  return useMemo(() => {
    if (mode === "card") {
      return groupExpensesByCard(expenses);
    }
    return groupExpenses(expenses, mode);
  }, [expenses, mode]);
}

function SidebarReceiptItem({ expense }: { expense: Expense }) {
  return (
    <li>
      <Link
        href="/dashboard/expenses"
        className="block border-b border-qb-border-light px-4 py-2.5 transition hover:bg-qb-bg/60 last:border-b-0"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-xs font-semibold text-qb-text">
            {expense.merchant}
          </p>
          <p className="shrink-0 text-xs font-bold tabular-nums text-qb-text">
            {formatCurrency(expense.amount)}
          </p>
        </div>
        <p className="mt-0.5 text-[10px] text-qb-text-muted">
          {formatDate(expense.date)}
        </p>
      </Link>
    </li>
  );
}

function SidebarMonthFolder({ monthGroup }: { monthGroup: ExpenseGroup }) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="border-b border-qb-border-light last:border-b-0">
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex w-full items-center gap-2 bg-qb-bg/20 py-2 pl-6 pr-4 text-left transition hover:bg-qb-bg/50"
      >
        <IconChevronDown
          className={`h-3 w-3 shrink-0 text-qb-text-muted transition-transform ${
            collapsed ? "-rotate-90" : ""
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-qb-text">
            {monthGroup.label}
          </p>
          <p className="text-[10px] text-qb-text-muted">
            {monthGroup.expenses.length} receipt
            {monthGroup.expenses.length === 1 ? "" : "s"}
          </p>
        </div>
        <p className="shrink-0 text-[10px] font-bold tabular-nums text-qb-text">
          {formatCurrency(monthGroup.total)}
        </p>
      </button>

      {!collapsed && (
        <ul className="border-t border-qb-border-light bg-qb-bg/30">
          {monthGroup.expenses.map((expense) => (
            <SidebarReceiptItem key={expense.id} expense={expense} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SidebarFolderGroup({
  group,
  nestByMonth,
}: {
  group: ExpenseGroup;
  nestByMonth: boolean;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const monthGroups = useMemo(
    () => (nestByMonth ? groupExpensesByMonth(group.expenses) : []),
    [group.expenses, nestByMonth],
  );

  return (
    <div className="border-b border-qb-border-light last:border-b-0">
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition hover:bg-qb-bg/60"
      >
        <IconChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-qb-text-muted transition-transform ${
            collapsed ? "-rotate-90" : ""
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-qb-text">
            {group.label}
          </p>
          <p className="text-[10px] text-qb-text-muted">
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
        <p className="shrink-0 text-[10px] font-bold tabular-nums text-qb-text">
          {formatCurrency(group.total)}
        </p>
      </button>

      {!collapsed && (
        <div className="border-t border-qb-border-light bg-qb-bg/30">
          {monthGroups.length > 0 ? (
            monthGroups.map((monthGroup) => (
              <SidebarMonthFolder key={monthGroup.key} monthGroup={monthGroup} />
            ))
          ) : (
            <ul>
              {group.expenses.map((expense) => (
                <SidebarReceiptItem key={expense.id} expense={expense} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface SidebarReceiptFoldersProps {
  expenses: Expense[];
}

export function SidebarReceiptFolders({ expenses }: SidebarReceiptFoldersProps) {
  const [folderMode, setFolderMode] = useState<SidebarFolderMode>("month");
  const groups = useFolderGroups(expenses, folderMode);

  return (
    <section className="flex min-h-0 flex-1 flex-col border-t border-qb-border-light">
      <div className="shrink-0 px-3 pb-2 pt-3">
        <div className="flex items-center gap-2 px-2 pb-2">
          <IconExpenses className="h-4 w-4 text-qb-blue" />
          <p className="text-xs font-bold uppercase tracking-wider text-qb-text-muted">
            Receipt folders
          </p>
        </div>
        <div
          className="flex flex-wrap gap-1 rounded-lg bg-qb-bg p-1"
          role="tablist"
          aria-label="Receipt folder views"
        >
          {SIDEBAR_FOLDER_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={folderMode === mode}
              onClick={() => setFolderMode(mode)}
              className={`rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                folderMode === mode
                  ? "bg-qb-surface text-qb-text shadow-sm"
                  : "text-qb-text-secondary hover:text-qb-text"
              }`}
            >
              {SIDEBAR_FOLDER_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-8 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-qb-bg">
              <IconReceipt className="h-5 w-5 text-qb-text-muted" />
            </div>
            <p className="text-xs font-semibold text-qb-text-secondary">
              No receipts yet
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-qb-text-muted">
              Scan receipts to populate folders here
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <SidebarFolderGroup
              key={group.key}
              group={group}
              nestByMonth={folderMode === "card"}
            />
          ))
        )}
      </div>
    </section>
  );
}
