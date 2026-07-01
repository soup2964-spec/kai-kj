import { CATEGORY_META } from "@/lib/categories";
import { formatCardLabel } from "@/lib/card-last-four";
import {
  DEFAULT_EXPENSE_PERIOD_FILTER,
  filterExpensesByPeriod,
  groupExpensesByBillable,
  groupExpensesByCard,
  groupExpensesByDate,
  groupExpensesByMonth,
  groupExpensesByWorkOrder,
  monthKeyFromDate,
  dayKeyFromDate,
  formatMonthLabel,
  formatDayLabel,
  parsePurchaseDate,
  type ExpenseGroup,
  type ExpensePeriodFilter,
} from "@/lib/expense-grouping";
import {
  findDuplicateExpenseIds,
  getMissingInfoReasons,
  getVendorName,
  INBOX_STATUS_LABELS,
} from "@/lib/receipt-workflow";
import { formatWorkOrderLabel, isWorkOrderMissing } from "@/lib/work-order";
import type {
  BillableStatus,
  Expense,
  ExpenseCategory,
  ReceiptInboxStatus,
} from "@/lib/types";
import { EXPENSE_CATEGORIES } from "@/lib/types";

export type ReceiptGroupBy =
  | "none"
  | "month"
  | "card"
  | "billable"
  | "date"
  | "workorder"
  | "category"
  | "property"
  | "vendor"
  | "inboxStatus";

export type ReceiptSort =
  | "date-newest"
  | "date-oldest"
  | "amount-high"
  | "amount-low"
  | "merchant-az"
  | "merchant-za";

export type ReceiptWidget =
  | { id: string; type: "groupBy"; dimension: ReceiptGroupBy }
  | { id: string; type: "sort"; sort: ReceiptSort }
  | { id: string; type: "search"; query: string }
  | {
      id: string;
      type: "inboxStatus";
      status: "all" | ReceiptInboxStatus;
    }
  | { id: string; type: "billable"; status: "all" | BillableStatus }
  | { id: string; type: "period"; filter: ExpensePeriodFilter }
  | { id: string; type: "category"; category: "all" | ExpenseCategory }
  | { id: string; type: "property"; property: "all" | string }
  | { id: string; type: "card"; card: "all" | "missing" | string }
  | { id: string; type: "workOrder"; mode: "all" | "has" | "missing" }
  | {
      id: string;
      type: "flags";
      missingInfo: boolean;
      duplicates: boolean;
    };

export type AddableReceiptWidgetType = Exclude<
  ReceiptWidget["type"],
  "groupBy" | "sort"
>;

export const RECEIPT_GROUP_BY_LABELS: Record<ReceiptGroupBy, string> = {
  none: "No grouping",
  month: "Month",
  card: "Card",
  billable: "Billable",
  date: "Date",
  workorder: "Work order",
  category: "Category",
  property: "Property",
  vendor: "Vendor",
  inboxStatus: "Inbox status",
};

export const RECEIPT_SORT_LABELS: Record<ReceiptSort, string> = {
  "date-newest": "Date · newest",
  "date-oldest": "Date · oldest",
  "amount-high": "Amount · high",
  "amount-low": "Amount · low",
  "merchant-az": "Merchant · A–Z",
  "merchant-za": "Merchant · Z–A",
};

export const ADDABLE_WIDGET_LABELS: Record<AddableReceiptWidgetType, string> = {
  search: "Search",
  inboxStatus: "Inbox status",
  billable: "Billable",
  period: "Period",
  category: "Category",
  property: "Property",
  card: "Card",
  workOrder: "Work order",
  flags: "Flags",
};

export const DEFAULT_RECEIPT_WIDGETS: ReceiptWidget[] = [
  { id: "group-by", type: "groupBy", dimension: "month" },
  { id: "sort", type: "sort", sort: "date-newest" },
];

let widgetIdCounter = 0;

export function createReceiptWidgetId(prefix: string): string {
  widgetIdCounter += 1;
  return `${prefix}-${widgetIdCounter}`;
}

export function createReceiptWidget(
  type: AddableReceiptWidgetType,
): ReceiptWidget {
  const id = createReceiptWidgetId(type);
  switch (type) {
    case "search":
      return { id, type, query: "" };
    case "inboxStatus":
      return { id, type, status: "all" };
    case "billable":
      return { id, type, status: "all" };
    case "period":
      return { id, type, filter: { ...DEFAULT_EXPENSE_PERIOD_FILTER } };
    case "category":
      return { id, type, category: "all" };
    case "property":
      return { id, type, property: "all" };
    case "card":
      return { id, type, card: "all" };
    case "workOrder":
      return { id, type, mode: "all" };
    case "flags":
      return { id, type, missingInfo: false, duplicates: false };
  }
}

function sumAmount(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

function purchaseDateMs(date: string): number {
  return parsePurchaseDate(date)?.getTime() ?? 0;
}

export function sortReceiptExpenses(
  expenses: Expense[],
  sort: ReceiptSort,
): Expense[] {
  const copy = [...expenses];
  switch (sort) {
    case "date-newest":
      return copy.sort((a, b) => purchaseDateMs(b.date) - purchaseDateMs(a.date));
    case "date-oldest":
      return copy.sort((a, b) => purchaseDateMs(a.date) - purchaseDateMs(b.date));
    case "amount-high":
      return copy.sort((a, b) => b.amount - a.amount);
    case "amount-low":
      return copy.sort((a, b) => a.amount - b.amount);
    case "merchant-az":
      return copy.sort((a, b) => a.merchant.localeCompare(b.merchant));
    case "merchant-za":
      return copy.sort((a, b) => b.merchant.localeCompare(a.merchant));
  }
}

function workOrderGroupKey(expense: Expense): string {
  if (isWorkOrderMissing(expense)) return "wo-missing";
  if (expense.workOrderNumber) return expense.workOrderNumber;
  if (expense.billableStatus !== "billable") return "no-wo-required";
  return "no-wo";
}

function workOrderGroupLabel(key: string): string {
  if (key === "wo-missing") return "WO missing";
  if (key === "no-wo-required") return "No WO required";
  if (key === "no-wo") return "No work order";
  return formatWorkOrderLabel(key);
}

function groupKeyForExpense(
  expense: Expense,
  dimension: ReceiptGroupBy,
): string {
  switch (dimension) {
    case "month":
      return monthKeyFromDate(expense.date);
    case "card":
      return expense.cardLastFour ?? "unknown";
    case "billable":
      return expense.billableStatus;
    case "date":
      return dayKeyFromDate(expense.date);
    case "workorder":
      return workOrderGroupKey(expense);
    case "category":
      return expense.category;
    case "property":
      return expense.propertyName?.trim() || "unknown";
    case "vendor":
      return getVendorName(expense) || "unknown";
    case "inboxStatus":
      return expense.inboxStatus;
    default:
      return "all";
  }
}

function groupLabelForKey(
  key: string,
  expense: Expense,
  dimension: ReceiptGroupBy,
): string {
  switch (dimension) {
    case "month":
      return formatMonthLabel(key);
    case "card":
      return formatCardLabel(
        key === "unknown" ? null : key,
        expense.cardBrand,
      );
    case "billable":
      return key === "billable"
        ? "Billable"
        : key === "non_billable"
          ? "Non-billable"
          : "Needs review";
    case "date":
      return formatDayLabel(key);
    case "workorder":
      return workOrderGroupLabel(key);
    case "category":
      return CATEGORY_META[key as ExpenseCategory]?.label ?? key;
    case "property":
      return key === "unknown" ? "No property" : key;
    case "vendor":
      return key === "unknown" ? "No vendor" : key;
    case "inboxStatus":
      return INBOX_STATUS_LABELS[key as ReceiptInboxStatus] ?? key;
    default:
      return key;
  }
}

export function groupReceiptExpenses(
  expenses: Expense[],
  dimension: ReceiptGroupBy,
): ExpenseGroup[] {
  if (dimension === "none") return [];

  const buckets = new Map<string, Expense[]>();
  const labelByKey = new Map<string, string>();

  for (const expense of expenses) {
    const key = groupKeyForExpense(expense, dimension);
    const list = buckets.get(key) ?? [];
    list.push(expense);
    buckets.set(key, list);
    if (!labelByKey.has(key)) {
      labelByKey.set(key, groupLabelForKey(key, expense, dimension));
    }
  }

  return [...buckets.entries()].map(([key, items]) => ({
    key,
    label: labelByKey.get(key) ?? key,
    expenses: items,
    total: sumAmount(items),
  }));
}

function applyFilterWidget(
  expenses: Expense[],
  widget: ReceiptWidget,
  allExpenses: Expense[],
): Expense[] {
  switch (widget.type) {
    case "search": {
      const query = widget.query.trim().toLowerCase();
      if (!query) return expenses;
      return expenses.filter((expense) => {
        const haystack = [
          expense.merchant,
          getVendorName(expense),
          expense.amount.toFixed(2),
          expense.date,
          CATEGORY_META[expense.category]?.label ?? expense.category,
          expense.propertyName,
          expense.workOrderNumber,
          formatCardLabel(expense.cardLastFour, expense.cardBrand),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
    }
    case "inboxStatus":
      if (widget.status === "all") return expenses;
      return expenses.filter((expense) => expense.inboxStatus === widget.status);
    case "billable":
      if (widget.status === "all") return expenses;
      return expenses.filter(
        (expense) => expense.billableStatus === widget.status,
      );
    case "period":
      return filterExpensesByPeriod(expenses, widget.filter);
    case "category":
      if (widget.category === "all") return expenses;
      return expenses.filter((expense) => expense.category === widget.category);
    case "property":
      if (widget.property === "all") return expenses;
      return expenses.filter(
        (expense) => (expense.propertyName?.trim() || "") === widget.property,
      );
    case "card":
      if (widget.card === "all") return expenses;
      if (widget.card === "missing") {
        return expenses.filter((expense) => !expense.cardLastFour);
      }
      return expenses.filter(
        (expense) => expense.cardLastFour === widget.card,
      );
    case "workOrder":
      if (widget.mode === "all") return expenses;
      if (widget.mode === "has") {
        return expenses.filter((expense) => Boolean(expense.workOrderNumber));
      }
      return expenses.filter((expense) => isWorkOrderMissing(expense));
    case "flags": {
      const duplicateIds = findDuplicateExpenseIds(allExpenses);
      return expenses.filter((expense) => {
        if (widget.missingInfo && getMissingInfoReasons(expense).length === 0) {
          return false;
        }
        if (
          widget.duplicates &&
          !expense.duplicateOfId &&
          !duplicateIds.has(expense.id)
        ) {
          return false;
        }
        return true;
      });
    }
    default:
      return expenses;
  }
}

export type ReceiptWidgetResult =
  | {
      view: "list";
      items: Expense[];
      total: number;
      count: number;
    }
  | {
      view: "groups";
      groups: ExpenseGroup[];
      total: number;
      count: number;
    };

export function applyReceiptWidgets(
  expenses: Expense[],
  widgets: ReceiptWidget[],
): ReceiptWidgetResult {
  const groupByWidget = widgets.find((widget) => widget.type === "groupBy");
  const sortWidget = widgets.find((widget) => widget.type === "sort");
  const dimension = groupByWidget?.dimension ?? "month";
  const sort = sortWidget?.sort ?? "date-newest";

  let filtered = expenses;
  for (const widget of widgets) {
    if (widget.type === "groupBy" || widget.type === "sort") continue;
    filtered = applyFilterWidget(filtered, widget, expenses);
  }

  const sorted = sortReceiptExpenses(filtered, sort);
  const total = sumAmount(sorted);
  const count = sorted.length;

  if (dimension === "none") {
    return { view: "list", items: sorted, total, count };
  }

  const legacyDateSort = sort === "date-oldest" ? "oldest" : "newest";
  const groups =
    dimension === "month"
      ? groupExpensesByMonth(sorted, legacyDateSort)
      : dimension === "card"
        ? groupExpensesByCard(sorted, legacyDateSort)
        : dimension === "billable"
          ? groupExpensesByBillable(sorted, legacyDateSort)
          : dimension === "date"
            ? groupExpensesByDate(sorted, legacyDateSort)
            : dimension === "workorder"
              ? groupExpensesByWorkOrder(sorted, legacyDateSort)
              : groupReceiptExpenses(sorted, dimension);

  return { view: "groups", groups, total, count };
}

export function getUniquePropertyNames(expenses: Expense[]): string[] {
  const names = new Set<string>();
  for (const expense of expenses) {
    const value = expense.propertyName?.trim();
    if (value) names.add(value);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

export function getUniqueCardLastFours(expenses: Expense[]): string[] {
  const cards = new Set<string>();
  for (const expense of expenses) {
    if (expense.cardLastFour) cards.add(expense.cardLastFour);
  }
  return [...cards].sort((a, b) => a.localeCompare(b));
}

export { EXPENSE_CATEGORIES };
