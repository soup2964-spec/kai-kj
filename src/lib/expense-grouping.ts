import { formatCardLabel } from "@/lib/card-last-four";
import {
  formatWorkOrderLabel,
  isWorkOrderMissing,
} from "@/lib/work-order";
import type { BillableStatus, Expense } from "@/lib/types";

export type ExpenseGroupMode = "month" | "card" | "billable" | "date" | "workorder";

export type ExpenseDateSort = "newest" | "oldest";

export interface ExpenseGroup {
  key: string;
  label: string;
  expenses: Expense[];
  total: number;
}

const BILLABLE_LABELS: Record<BillableStatus, string> = {
  billable: "Billable",
  non_billable: "Non-billable",
  review: "Needs review",
};

const BILLABLE_ORDER: BillableStatus[] = [
  "billable",
  "non_billable",
  "review",
];

export function monthKeyFromDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "unknown";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatMonthLabel(monthKey: string): string {
  if (monthKey === "unknown") return "Unknown date";
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function sumAmount(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

function sortByDate(
  expenses: Expense[],
  sort: ExpenseDateSort = "newest",
): Expense[] {
  return [...expenses].sort((a, b) => {
    const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
    return sort === "newest" ? diff : -diff;
  });
}

export function sortExpensesByDate(
  expenses: Expense[],
  sort: ExpenseDateSort = "newest",
): Expense[] {
  return sortByDate(expenses, sort);
}

export function groupExpensesByMonth(
  expenses: Expense[],
  sort: ExpenseDateSort = "newest",
): ExpenseGroup[] {
  const buckets = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const key = monthKeyFromDate(expense.date);
    const list = buckets.get(key) ?? [];
    list.push(expense);
    buckets.set(key, list);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => (sort === "newest" ? b.localeCompare(a) : a.localeCompare(b)))
    .map(([key, items]) => {
      const sorted = sortByDate(items, sort);
      return {
        key,
        label: formatMonthLabel(key),
        expenses: sorted,
        total: sumAmount(sorted),
      };
    });
}

export function groupExpensesByCard(
  expenses: Expense[],
  sort: ExpenseDateSort = "newest",
): ExpenseGroup[] {
  const buckets = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const key = expense.cardLastFour ?? "unknown";
    const list = buckets.get(key) ?? [];
    list.push(expense);
    buckets.set(key, list);
  }

  const groups = [...buckets.entries()].map(([key, items]) => {
    const sorted = sortByDate(items, sort);
    return {
      key,
      label: formatCardLabel(
        key === "unknown" ? null : key,
        sorted[0]?.cardBrand,
      ),
      expenses: sorted,
      total: sumAmount(sorted),
    };
  });

  return groups.sort((a, b) => {
    if (a.key === "unknown") return 1;
    if (b.key === "unknown") return -1;
    return a.key.localeCompare(b.key);
  });
}

export function groupExpensesByBillable(
  expenses: Expense[],
  sort: ExpenseDateSort = "newest",
): ExpenseGroup[] {
  const buckets = new Map<BillableStatus, Expense[]>();

  for (const expense of expenses) {
    const list = buckets.get(expense.billableStatus) ?? [];
    list.push(expense);
    buckets.set(expense.billableStatus, list);
  }

  return BILLABLE_ORDER.filter((status) => buckets.has(status)).map(
    (status) => {
      const sorted = sortByDate(buckets.get(status)!, sort);
      return {
        key: status,
        label: BILLABLE_LABELS[status],
        expenses: sorted,
        total: sumAmount(sorted),
      };
    },
  );
}

export function groupExpensesByWorkOrder(
  expenses: Expense[],
  sort: ExpenseDateSort = "newest",
): ExpenseGroup[] {
  const missing: Expense[] = [];
  const buckets = new Map<string, Expense[]>();
  const nonBillable: Expense[] = [];

  for (const expense of expenses) {
    if (isWorkOrderMissing(expense)) {
      missing.push(expense);
      continue;
    }

    if (expense.workOrderNumber) {
      const list = buckets.get(expense.workOrderNumber) ?? [];
      list.push(expense);
      buckets.set(expense.workOrderNumber, list);
      continue;
    }

    if (expense.billableStatus !== "billable") {
      nonBillable.push(expense);
    }
  }

  const groups: ExpenseGroup[] = [];

  if (missing.length > 0) {
    const sorted = sortByDate(missing, sort);
    groups.push({
      key: "wo-missing",
      label: "WO missing",
      expenses: sorted,
      total: sumAmount(sorted),
    });
  }

  const woGroups = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => {
      const sorted = sortByDate(items, sort);
      return {
        key,
        label: formatWorkOrderLabel(key),
        expenses: sorted,
        total: sumAmount(sorted),
      };
    });

  groups.push(...woGroups);

  if (nonBillable.length > 0) {
    const sorted = sortByDate(nonBillable, sort);
    groups.push({
      key: "not-billable",
      label: "No WO required",
      expenses: sorted,
      total: sumAmount(sorted),
    });
  }

  return groups;
}

export function groupExpensesByDate(
  expenses: Expense[],
  sort: ExpenseDateSort = "newest",
): ExpenseGroup[] {
  const sorted = sortByDate(expenses, sort);
  if (sorted.length === 0) return [];

  return [
    {
      key: "all",
      label: "All receipts",
      expenses: sorted,
      total: sumAmount(sorted),
    },
  ];
}

export function groupExpenses(
  expenses: Expense[],
  mode: ExpenseGroupMode,
  sort: ExpenseDateSort = "newest",
): ExpenseGroup[] {
  switch (mode) {
    case "month":
      return groupExpensesByMonth(expenses, sort);
    case "card":
      return groupExpensesByCard(expenses, sort);
    case "billable":
      return groupExpensesByBillable(expenses, sort);
    case "date":
      return groupExpensesByDate(expenses, sort);
    case "workorder":
      return groupExpensesByWorkOrder(expenses, sort);
  }
}

export const GROUP_MODE_LABELS: Record<ExpenseGroupMode, string> = {
  month: "Month",
  card: "Card",
  billable: "Billable",
  date: "Date",
  workorder: "Work order",
};

export const DATE_SORT_LABELS: Record<ExpenseDateSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
};
