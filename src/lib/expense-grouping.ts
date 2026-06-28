import { formatCardLabel } from "@/lib/card-last-four";
import {
  formatWorkOrderLabel,
  isWorkOrderMissing,
} from "@/lib/work-order";
import type { BillableStatus, Expense } from "@/lib/types";

export type ExpenseGroupMode = "month" | "billable" | "date" | "workorder";

export type ExpenseDateSort = "newest" | "oldest";

export type ExpensePeriodFilter = {
  month: "all" | number;
  year: "all" | number;
};

export const DEFAULT_EXPENSE_PERIOD_FILTER: ExpensePeriodFilter = {
  month: "all",
  year: "all",
};

export const MONTH_FILTER_OPTIONS: { value: ExpensePeriodFilter["month"]; label: string }[] =
  [
    { value: "all", label: "All months" },
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

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
  const parsed = parsePurchaseDate(date);
  if (!parsed) return "unknown";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Parse receipt purchase dates without UTC timezone shifts on YYYY-MM-DD values. */
export function parsePurchaseDate(date: string): Date | null {
  const isoDay = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDay) {
    const year = Number(isoDay[1]);
    const month = Number(isoDay[2]);
    const day = Number(isoDay[3]);
    const local = new Date(year, month - 1, day);
    return Number.isNaN(local.getTime()) ? null : local;
  }

  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function dayKeyFromDate(date: string): string {
  const parsed = parsePurchaseDate(date);
  if (!parsed) return "unknown";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDayLabel(dayKey: string): string {
  if (dayKey === "unknown") return "Unknown date";
  const [year, month, day] = dayKey.split("-").map(Number);
  if (!year || !month || !day) return dayKey;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function purchaseDateMs(date: string): number {
  return parsePurchaseDate(date)?.getTime() ?? 0;
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
    const diff = purchaseDateMs(b.date) - purchaseDateMs(a.date);
    if (diff !== 0) {
      return sort === "newest" ? diff : -diff;
    }
    return a.merchant.localeCompare(b.merchant);
  });
}

export function sortExpensesByDate(
  expenses: Expense[],
  sort: ExpenseDateSort = "newest",
): Expense[] {
  return sortByDate(expenses, sort);
}

export function getExpenseYears(expenses: Expense[]): number[] {
  const years = new Set<number>([new Date().getFullYear()]);

  for (const expense of expenses) {
    const parsed = parsePurchaseDate(expense.date);
    if (parsed) {
      years.add(parsed.getFullYear());
    }
  }

  return [...years].sort((a, b) => b - a);
}

export function formatPeriodLabel(filter: ExpensePeriodFilter): string {
  if (filter.month === "all" && filter.year === "all") {
    return "All dates";
  }

  if (filter.month === "all" && filter.year !== "all") {
    return String(filter.year);
  }

  if (filter.month !== "all" && filter.year === "all") {
    const monthLabel =
      MONTH_FILTER_OPTIONS.find((option) => option.value === filter.month)
        ?.label ?? "Month";
    return monthLabel;
  }

  const monthKey = `${filter.year}-${String(filter.month).padStart(2, "0")}`;
  return formatMonthLabel(monthKey);
}

export function filterExpensesByPeriod(
  expenses: Expense[],
  filter: ExpensePeriodFilter,
): Expense[] {
  return expenses.filter((expense) => {
    const parsed = parsePurchaseDate(expense.date);
    if (!parsed) {
      return filter.month === "all" && filter.year === "all";
    }

    if (filter.year !== "all" && parsed.getFullYear() !== filter.year) {
      return false;
    }

    if (filter.month !== "all" && parsed.getMonth() + 1 !== filter.month) {
      return false;
    }

    return true;
  });
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
  const buckets = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const key = dayKeyFromDate(expense.date);
    const list = buckets.get(key) ?? [];
    list.push(expense);
    buckets.set(key, list);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => {
      if (a === "unknown") return 1;
      if (b === "unknown") return -1;
      return sort === "newest" ? b.localeCompare(a) : a.localeCompare(b);
    })
    .map(([key, items]) => {
      const sorted = sortByDate(items, sort);
      return {
        key,
        label: formatDayLabel(key),
        expenses: sorted,
        total: sumAmount(sorted),
      };
    });
}

export function groupExpenses(
  expenses: Expense[],
  mode: ExpenseGroupMode,
  sort: ExpenseDateSort = "newest",
): ExpenseGroup[] {
  switch (mode) {
    case "month":
      return groupExpensesByMonth(expenses, sort);
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
  billable: "Billable",
  date: "Date",
  workorder: "Work order",
};

export const DATE_SORT_LABELS: Record<ExpenseDateSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
};
