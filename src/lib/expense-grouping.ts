import { formatCardLabel } from "@/lib/card-last-four";
import type { BillableStatus, Expense } from "@/lib/types";

export type ExpenseGroupMode = "month" | "card" | "billable" | "date";

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
      label: formatCardLabel(key === "unknown" ? null : key),
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
  }
}

export const GROUP_MODE_LABELS: Record<ExpenseGroupMode, string> = {
  month: "Month",
  card: "Card",
  billable: "Billable",
  date: "Date",
};

export const DATE_SORT_LABELS: Record<ExpenseDateSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
};
