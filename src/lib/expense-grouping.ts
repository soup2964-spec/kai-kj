import { formatCardLabel } from "@/lib/card-last-four";
import type { BillableStatus, Expense } from "@/lib/types";

export type ExpenseGroupMode = "month" | "card" | "billable";

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

function sortByDateDesc(expenses: Expense[]): Expense[] {
  return [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function groupExpensesByMonth(expenses: Expense[]): ExpenseGroup[] {
  const buckets = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const key = monthKeyFromDate(expense.date);
    const list = buckets.get(key) ?? [];
    list.push(expense);
    buckets.set(key, list);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => {
      const sorted = sortByDateDesc(items);
      return {
        key,
        label: formatMonthLabel(key),
        expenses: sorted,
        total: sumAmount(sorted),
      };
    });
}

export function groupExpensesByCard(expenses: Expense[]): ExpenseGroup[] {
  const buckets = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const key = expense.cardLastFour ?? "unknown";
    const list = buckets.get(key) ?? [];
    list.push(expense);
    buckets.set(key, list);
  }

  const groups = [...buckets.entries()].map(([key, items]) => {
    const sorted = sortByDateDesc(items);
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

export function groupExpensesByBillable(expenses: Expense[]): ExpenseGroup[] {
  const buckets = new Map<BillableStatus, Expense[]>();

  for (const expense of expenses) {
    const list = buckets.get(expense.billableStatus) ?? [];
    list.push(expense);
    buckets.set(expense.billableStatus, list);
  }

  return BILLABLE_ORDER.filter((status) => buckets.has(status)).map(
    (status) => {
      const sorted = sortByDateDesc(buckets.get(status)!);
      return {
        key: status,
        label: BILLABLE_LABELS[status],
        expenses: sorted,
        total: sumAmount(sorted),
      };
    },
  );
}

export function groupExpenses(
  expenses: Expense[],
  mode: ExpenseGroupMode,
): ExpenseGroup[] {
  switch (mode) {
    case "month":
      return groupExpensesByMonth(expenses);
    case "card":
      return groupExpensesByCard(expenses);
    case "billable":
      return groupExpensesByBillable(expenses);
  }
}

export const GROUP_MODE_LABELS: Record<ExpenseGroupMode, string> = {
  month: "Month",
  card: "Card",
  billable: "Billable",
};
