"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Expense } from "@/lib/types";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";
import { formatCurrency, formatDate } from "@/lib/categories";
import {
  MONTH_FILTER_OPTIONS,
  getExpenseYears,
} from "@/lib/expense-grouping";
import {
  ADDABLE_WIDGET_LABELS,
  applyReceiptWidgets,
  createReceiptWidget,
  DEFAULT_RECEIPT_WIDGETS,
  getUniqueCardLastFours,
  getUniquePropertyNames,
  RECEIPT_GROUP_BY_LABELS,
  RECEIPT_SORT_LABELS,
  type AddableReceiptWidgetType,
  type ReceiptGroupBy,
  type ReceiptSort,
  type ReceiptWidget,
} from "@/lib/receipt-widgets";
import { INBOX_STATUS_LABELS, INBOX_STATUS_ORDER } from "@/lib/receipt-workflow";
import type { ExpenseGroup } from "@/lib/expense-grouping";
import { IconChevronDown, IconExpenses, IconReceipt } from "./icons";

interface SidebarReceiptWidgetsProps {
  expenses: Expense[];
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

function SidebarGroupSection({ group }: { group: ExpenseGroup }) {
  const [collapsed, setCollapsed] = useState(true);

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
          <p className="truncate text-xs font-bold text-qb-text">{group.label}</p>
          <p className="text-[10px] text-qb-text-muted">
            {group.expenses.length} receipt
            {group.expenses.length === 1 ? "" : "s"}
          </p>
        </div>
        <p className="shrink-0 text-[10px] font-bold tabular-nums text-qb-text">
          {formatCurrency(group.total)}
        </p>
      </button>

      {!collapsed && (
        <ul className="border-t border-qb-border-light bg-qb-bg/30">
          {group.expenses.map((expense) => (
            <SidebarReceiptItem key={expense.id} expense={expense} />
          ))}
        </ul>
      )}
    </div>
  );
}

function WidgetShell({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-qb-border-light bg-qb-surface px-2.5 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-qb-text-muted">
          {title}
        </p>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-[10px] font-semibold text-qb-text-muted transition hover:text-qb-danger"
            aria-label={`Remove ${title} widget`}
          >
            Remove
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function WidgetControls({
  widget,
  expenses,
  onChange,
  onRemove,
}: {
  widget: ReceiptWidget;
  expenses: Expense[];
  onChange: (widget: ReceiptWidget) => void;
  onRemove?: () => void;
}) {
  const selectClass =
    "w-full rounded border border-qb-border bg-qb-bg px-2 py-1.5 text-[11px] text-qb-text";

  switch (widget.type) {
    case "groupBy":
      return (
        <WidgetShell title="Group by">
          <select
            value={widget.dimension}
            onChange={(event) =>
              onChange({
                ...widget,
                dimension: event.target.value as ReceiptGroupBy,
              })
            }
            className={selectClass}
          >
            {(Object.keys(RECEIPT_GROUP_BY_LABELS) as ReceiptGroupBy[]).map(
              (dimension) => (
                <option key={dimension} value={dimension}>
                  {RECEIPT_GROUP_BY_LABELS[dimension]}
                </option>
              ),
            )}
          </select>
        </WidgetShell>
      );
    case "sort":
      return (
        <WidgetShell title="Sort">
          <select
            value={widget.sort}
            onChange={(event) =>
              onChange({
                ...widget,
                sort: event.target.value as ReceiptSort,
              })
            }
            className={selectClass}
          >
            {(Object.keys(RECEIPT_SORT_LABELS) as ReceiptSort[]).map((sort) => (
              <option key={sort} value={sort}>
                {RECEIPT_SORT_LABELS[sort]}
              </option>
            ))}
          </select>
        </WidgetShell>
      );
    case "search":
      return (
        <WidgetShell title="Search" onRemove={onRemove}>
          <input
            type="search"
            value={widget.query}
            onChange={(event) =>
              onChange({ ...widget, query: event.target.value })
            }
            placeholder="Merchant, amount, WO..."
            className={selectClass}
          />
        </WidgetShell>
      );
    case "inboxStatus":
      return (
        <WidgetShell title="Inbox status" onRemove={onRemove}>
          <select
            value={widget.status}
            onChange={(event) =>
              onChange({
                ...widget,
                status: event.target.value as typeof widget.status,
              })
            }
            className={selectClass}
          >
            <option value="all">All statuses</option>
            {INBOX_STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {INBOX_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </WidgetShell>
      );
    case "billable":
      return (
        <WidgetShell title="Billable" onRemove={onRemove}>
          <select
            value={widget.status}
            onChange={(event) =>
              onChange({
                ...widget,
                status: event.target.value as typeof widget.status,
              })
            }
            className={selectClass}
          >
            <option value="all">All</option>
            <option value="billable">Billable</option>
            <option value="non_billable">Non-billable</option>
            <option value="review">Needs review</option>
          </select>
        </WidgetShell>
      );
    case "period": {
      const years = getExpenseYears(expenses);
      return (
        <WidgetShell title="Period" onRemove={onRemove}>
          <div className="grid grid-cols-3 gap-1.5">
            <select
              value={widget.filter.year === "all" ? "all" : String(widget.filter.year)}
              onChange={(event) =>
                onChange({
                  ...widget,
                  filter: {
                    ...widget.filter,
                    year:
                      event.target.value === "all"
                        ? "all"
                        : Number(event.target.value),
                  },
                })
              }
              className={selectClass}
            >
              <option value="all">Year</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={widget.filter.month === "all" ? "all" : String(widget.filter.month)}
              onChange={(event) =>
                onChange({
                  ...widget,
                  filter: {
                    ...widget.filter,
                    month:
                      event.target.value === "all"
                        ? "all"
                        : Number(event.target.value),
                  },
                })
              }
              className={selectClass}
            >
              {MONTH_FILTER_OPTIONS.map((option) => (
                <option
                  key={String(option.value)}
                  value={option.value === "all" ? "all" : String(option.value)}
                >
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={widget.filter.day === "all" ? "all" : String(widget.filter.day)}
              onChange={(event) =>
                onChange({
                  ...widget,
                  filter: {
                    ...widget.filter,
                    day:
                      event.target.value === "all"
                        ? "all"
                        : Number(event.target.value),
                  },
                })
              }
              className={selectClass}
            >
              <option value="all">Day</option>
              {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
        </WidgetShell>
      );
    }
    case "category":
      return (
        <WidgetShell title="Category" onRemove={onRemove}>
          <select
            value={widget.category}
            onChange={(event) =>
              onChange({
                ...widget,
                category: event.target.value as typeof widget.category,
              })
            }
            className={selectClass}
          >
            <option value="all">All categories</option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_META[category].label}
              </option>
            ))}
          </select>
        </WidgetShell>
      );
    case "property": {
      const properties = getUniquePropertyNames(expenses);
      return (
        <WidgetShell title="Property" onRemove={onRemove}>
          <select
            value={widget.property}
            onChange={(event) =>
              onChange({ ...widget, property: event.target.value })
            }
            className={selectClass}
          >
            <option value="all">All properties</option>
            {properties.map((property) => (
              <option key={property} value={property}>
                {property}
              </option>
            ))}
          </select>
        </WidgetShell>
      );
    }
    case "card": {
      const cards = getUniqueCardLastFours(expenses);
      return (
        <WidgetShell title="Card" onRemove={onRemove}>
          <select
            value={widget.card}
            onChange={(event) =>
              onChange({ ...widget, card: event.target.value })
            }
            className={selectClass}
          >
            <option value="all">All cards</option>
            <option value="missing">Missing card</option>
            {cards.map((card) => (
              <option key={card} value={card}>
                •••• {card}
              </option>
            ))}
          </select>
        </WidgetShell>
      );
    }
    case "workOrder":
      return (
        <WidgetShell title="Work order" onRemove={onRemove}>
          <select
            value={widget.mode}
            onChange={(event) =>
              onChange({
                ...widget,
                mode: event.target.value as typeof widget.mode,
              })
            }
            className={selectClass}
          >
            <option value="all">All</option>
            <option value="has">Has work order</option>
            <option value="missing">WO missing</option>
          </select>
        </WidgetShell>
      );
    case "flags":
      return (
        <WidgetShell title="Flags" onRemove={onRemove}>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[11px] text-qb-text-secondary">
              <input
                type="checkbox"
                checked={widget.missingInfo}
                onChange={(event) =>
                  onChange({ ...widget, missingInfo: event.target.checked })
                }
              />
              Missing info only
            </label>
            <label className="flex items-center gap-2 text-[11px] text-qb-text-secondary">
              <input
                type="checkbox"
                checked={widget.duplicates}
                onChange={(event) =>
                  onChange({ ...widget, duplicates: event.target.checked })
                }
              />
              Duplicates only
            </label>
          </div>
        </WidgetShell>
      );
  }
}

export function SidebarReceiptWidgets({ expenses }: SidebarReceiptWidgetsProps) {
  const [widgets, setWidgets] = useState<ReceiptWidget[]>(DEFAULT_RECEIPT_WIDGETS);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const result = useMemo(
    () => applyReceiptWidgets(expenses, widgets),
    [expenses, widgets],
  );

  const usedAddableTypes = new Set(
    widgets
      .map((widget) => widget.type)
      .filter((type): type is AddableReceiptWidgetType => type !== "groupBy" && type !== "sort"),
  );

  const availableToAdd = (
    Object.keys(ADDABLE_WIDGET_LABELS) as AddableReceiptWidgetType[]
  ).filter((type) => !usedAddableTypes.has(type));

  const updateWidget = (id: string, next: ReceiptWidget) => {
    setWidgets((current) =>
      current.map((widget) => (widget.id === id ? next : widget)),
    );
  };

  const removeWidget = (id: string) => {
    setWidgets((current) => current.filter((widget) => widget.id !== id));
  };

  const addWidget = (type: AddableReceiptWidgetType) => {
    setWidgets((current) => [...current, createReceiptWidget(type)]);
    setShowAddMenu(false);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col border-t border-qb-border-light">
      <div className="shrink-0 space-y-2 px-3 pb-2 pt-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <IconExpenses className="h-4 w-4 text-qb-blue" />
            <p className="text-xs font-bold uppercase tracking-wider text-qb-text-muted">
              Receipt widgets
            </p>
          </div>
          <span className="rounded bg-qb-bg px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-qb-text-secondary">
            {result.count}
          </span>
        </div>

        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-0.5">
          {widgets.map((widget) => (
            <WidgetControls
              key={widget.id}
              widget={widget}
              expenses={expenses}
              onChange={(next) => updateWidget(widget.id, next)}
              onRemove={
                widget.type === "groupBy" || widget.type === "sort"
                  ? undefined
                  : () => removeWidget(widget.id)
              }
            />
          ))}
        </div>

        {availableToAdd.length > 0 ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddMenu((value) => !value)}
              className="w-full rounded-lg border border-dashed border-qb-border px-2 py-1.5 text-[11px] font-semibold text-qb-text-secondary transition hover:border-qb-blue hover:text-qb-blue"
            >
              + Add filter widget
            </button>
            {showAddMenu ? (
              <div className="absolute left-0 right-0 z-10 mt-1 rounded-lg border border-qb-border bg-qb-surface p-1 shadow-lg">
                {availableToAdd.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addWidget(type)}
                    className="block w-full rounded px-2 py-1.5 text-left text-[11px] font-semibold text-qb-text transition hover:bg-qb-bg"
                  >
                    {ADDABLE_WIDGET_LABELS[type]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <p className="px-1 text-[10px] text-qb-text-muted">
          Total {formatCurrency(result.total)} · combine widgets to filter and sort
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-qb-border-light">
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-8 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-qb-bg">
              <IconReceipt className="h-5 w-5 text-qb-text-muted" />
            </div>
            <p className="text-xs font-semibold text-qb-text-secondary">
              No receipts yet
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-qb-text-muted">
              Scan receipts to build widget views here
            </p>
          </div>
        ) : result.count === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-qb-text-muted">
            No receipts match the current widgets.
          </div>
        ) : result.view === "list" ? (
          <ul>
            {result.items.map((expense) => (
              <SidebarReceiptItem key={expense.id} expense={expense} />
            ))}
          </ul>
        ) : (
          result.groups.map((group) => (
            <SidebarGroupSection key={group.key} group={group} />
          ))
        )}
      </div>
    </section>
  );
}
