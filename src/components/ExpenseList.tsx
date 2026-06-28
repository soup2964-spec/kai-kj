"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AccountingSyncBadge,
  canSubmitAccountingReview,
} from "@/components/AccountingSyncBadge";
import type { BillableStatus, Expense } from "@/lib/types";
import {
  GROUP_MODE_LABELS,
  groupExpenses,
  type ExpenseDateSort,
  type ExpenseGroup,
  type ExpenseGroupMode,
} from "@/lib/expense-grouping";
import { formatCardLabel } from "@/lib/card-last-four";
import { countMissingWorkOrders, formatWorkOrderLabel } from "@/lib/work-order";
import { ExpenseExportButton } from "@/components/ExpenseExportButton";
import { useExpenseContext } from "@/lib/expense-context";
import { CategoryBadge } from "./CategoryBadge";
import { BillableBadge } from "./BillableBadge";
import { CardBadge } from "./CardBadge";
import { WorkOrderBadge } from "./WorkOrderBadge";
import { ReceiptLineItemsList } from "./ReceiptLineItemsList";
import {
  IconChevronDown,
  IconCheck,
  IconExpenses,
  IconReceipt,
  IconTrash,
  IconX,
} from "./icons";
import { formatCurrency, formatDate } from "@/lib/categories";

interface ExpenseListProps {
  expenses: Expense[];
  dateSort?: ExpenseDateSort;
  onDateSortChange?: (sort: ExpenseDateSort) => void;
  onRemove: (id: string) => void;
  onUpdate: (
    id: string,
    patch: {
      billableStatus?: BillableStatus;
      cardLastFour?: string | null;
      workOrderNumber?: string | null;
    },
  ) => void;
}

function AccountingActions({
  expense,
  compact = false,
}: {
  expense: Expense;
  compact?: boolean;
}) {
  const { submitAccountingDecision, accountingBusyId } = useExpenseContext();
  const busy = accountingBusyId === expense.id;
  const canReview = canSubmitAccountingReview(expense.accountingStatus);

  if (!canReview) {
    return null;
  }

  return (
    <div
      className={`flex shrink-0 items-center gap-2 ${compact ? "" : "flex-wrap"}`}
    >
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          void submitAccountingDecision(expense.id, "approve");
        }}
        className="qb-btn-primary qb-btn-compact"
      >
        <IconCheck className="h-4 w-4" />
        {busy ? "Sending..." : "Approve"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          void submitAccountingDecision(expense.id, "disapprove");
        }}
        className="qb-btn-secondary qb-btn-compact"
      >
        <IconX />
        Disapprove
      </button>
    </div>
  );
}

function ExpenseRow({
  expense,
  expanded,
  onToggle,
  onRemove,
  onUpdate,
}: {
  expense: Expense;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: ExpenseListProps["onUpdate"];
}) {
  const hasLineItems = expense.lineItems.length > 0;
  const [cardInput, setCardInput] = useState(expense.cardLastFour ?? "");
  const [workOrderInput, setWorkOrderInput] = useState(
    expense.workOrderNumber ?? "",
  );
  const showWorkOrderField =
    expense.billableStatus === "billable" ||
    expense.billableStatus === "review";

  useEffect(() => {
    if (expanded) {
      setCardInput(expense.cardLastFour ?? "");
      setWorkOrderInput(expense.workOrderNumber ?? "");
    }
  }, [expanded, expense.cardLastFour, expense.workOrderNumber]);

  return (
    <li className="group">
      <div
        className={`flex items-center gap-3 px-4 py-3.5 lg:px-5 ${
          expanded ? "bg-qb-bg/50" : "lg:hover:bg-qb-bg/40"
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={`expense-items-${expense.id}`}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left active:opacity-80"
        >
          {expense.receiptImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={expense.receiptImage}
              alt=""
              className="h-11 w-11 shrink-0 rounded border border-qb-border object-cover lg:h-10 lg:w-10"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-qb-border bg-qb-bg lg:h-10 lg:w-10">
              <IconReceipt className="h-4 w-4 text-qb-text-muted" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-qb-text">
                {expense.merchant}
              </p>
              <IconChevronDown
                className={`h-4 w-4 shrink-0 text-qb-text-muted transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </div>
            <p className="text-xs text-qb-text-muted">
              {formatDate(expense.date)}
              {hasLineItems && !expanded && (
                <span className="ml-1.5 text-qb-text-secondary">
                  · {expense.lineItems.length} item
                  {expense.lineItems.length === 1 ? "" : "s"}
                </span>
              )}
              {!expanded && (
                <span className="ml-1.5 text-qb-text-secondary">
                  · tap for details
                </span>
              )}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <CategoryBadge category={expense.category} />
              <BillableBadge status={expense.billableStatus} />
              <CardBadge lastFour={expense.cardLastFour} brand={expense.cardBrand} />
              <WorkOrderBadge expense={expense} />
              <AccountingSyncBadge status={expense.accountingStatus} />
            </div>
          </div>

          <p className="hidden shrink-0 text-sm font-bold tabular-nums text-qb-text sm:block">
            {formatCurrency(expense.amount)}
          </p>
        </button>

        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <p className="shrink-0 text-sm font-bold tabular-nums text-qb-text sm:hidden">
            {formatCurrency(expense.amount)}
          </p>
          <AccountingActions expense={expense} compact />
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${expense.merchant}`}
            className="qb-btn-ghost shrink-0 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
          >
            <IconTrash />
          </button>
        </div>
      </div>

      {expanded && (
        <div
          id={`expense-items-${expense.id}`}
          className="border-t border-qb-border-light bg-qb-bg/30 px-4 py-3 lg:px-5 qb-animate-in space-y-3"
        >
          <div className="rounded-lg border border-qb-border bg-qb-surface p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
                  Accounting software
                </p>
                <p className="mt-1 text-sm text-qb-text-secondary">
                  Approve to send this receipt to your connected accounting
                  software. Disapprove keeps it in Kai KJ only.
                </p>
              </div>
              <AccountingSyncBadge status={expense.accountingStatus} size="md" />
            </div>

            {expense.accountingStatus === "synced" &&
            expense.accountingReference ? (
              <p className="mt-3 text-xs text-qb-text-secondary">
                Reference:{" "}
                <span className="font-semibold text-qb-text">
                  {expense.accountingReference}
                </span>
              </p>
            ) : null}

            {expense.accountingStatus === "failed" && expense.accountingError ? (
              <p className="mt-3 text-xs text-qb-danger">
                {expense.accountingError}
              </p>
            ) : null}

            <div className="mt-3">
              <AccountingActions expense={expense} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`billable-${expense.id}`}
                className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted"
              >
                Billable status
              </label>
              <select
                id={`billable-${expense.id}`}
                value={expense.billableStatus}
                onChange={(event) =>
                  onUpdate(expense.id, {
                    billableStatus: event.target.value as BillableStatus,
                  })
                }
                className="mt-1.5 w-full rounded border border-qb-border bg-qb-surface px-3 py-2 text-sm text-qb-text"
              >
                <option value="billable">Billable</option>
                <option value="non_billable">Non-billable</option>
                <option value="review">Needs review</option>
              </select>
              <p className="mt-1 text-xs text-qb-text-secondary">
                {expense.billableReason}
              </p>
            </div>

            {showWorkOrderField ? (
              <div>
                <label
                  htmlFor={`wo-${expense.id}`}
                  className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted"
                >
                  AppFolio work order
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    id={`wo-${expense.id}`}
                    type="text"
                    inputMode="numeric"
                    placeholder="76-2234"
                    value={workOrderInput}
                    onChange={(event) => {
                      const raw = event.target.value
                        .replace(/[^\d-]/g, "")
                        .slice(0, 10);
                      setWorkOrderInput(raw);
                    }}
                    className="w-full rounded border border-qb-border bg-qb-surface px-3 py-2 text-sm tabular-nums text-qb-text"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate(expense.id, {
                        workOrderNumber:
                          workOrderInput.trim() === ""
                            ? null
                            : workOrderInput,
                      })
                    }
                    className="qb-btn-secondary shrink-0 px-3 py-2 text-sm"
                  >
                    Save
                  </button>
                </div>
                <p className="mt-1 text-xs text-qb-text-secondary">
                  {expense.workOrderNumber
                    ? formatWorkOrderLabel(expense.workOrderNumber)
                    : "Required for billable receipts — enter the WO from AppFolio (e.g. 76-2234)"}
                </p>
              </div>
            ) : null}

            <div>
              <label
                htmlFor={`card-${expense.id}`}
                className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted"
              >
                Card last 4
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id={`card-${expense.id}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1234"
                  value={cardInput}
                  onChange={(event) =>
                    setCardInput(
                      event.target.value.replace(/\D/g, "").slice(0, 4),
                    )
                  }
                  className="w-full rounded border border-qb-border bg-qb-surface px-3 py-2 text-sm tabular-nums text-qb-text"
                />
                <button
                  type="button"
                  onClick={() =>
                    onUpdate(expense.id, {
                      cardLastFour: cardInput.length === 4 ? cardInput : null,
                    })
                  }
                  className="qb-btn-secondary shrink-0 px-3 py-2 text-sm"
                >
                  Save
                </button>
              </div>
              <p className="mt-1 text-xs text-qb-text-secondary">
                {expense.cardLastFour
                  ? formatCardLabel(expense.cardLastFour)
                  : "Not detected — enter digits to file under a card folder"}
              </p>
            </div>
          </div>

          {hasLineItems ? (
            <ReceiptLineItemsList items={expense.lineItems} />
          ) : (
            <p className="text-sm text-qb-text-muted">
              No line items saved for this receipt.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function FolderSection({
  group,
  expandedId,
  onToggleExpense,
  onRemove,
  onUpdate,
}: {
  group: ExpenseGroup;
  expandedId: string | null;
  onToggleExpense: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: ExpenseListProps["onUpdate"];
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border-b border-qb-border-light last:border-b-0">
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex w-full items-center gap-3 bg-qb-bg/40 px-4 py-3 text-left transition hover:bg-qb-bg/70 lg:px-5"
      >
        <IconChevronDown
          className={`h-4 w-4 shrink-0 text-qb-text-muted transition-transform ${
            collapsed ? "-rotate-90" : ""
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-qb-text">{group.label}</p>
          <p className="text-xs text-qb-text-muted">
            {group.expenses.length} receipt
            {group.expenses.length === 1 ? "" : "s"}
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold tabular-nums text-qb-text">
          {formatCurrency(group.total)}
        </p>
      </button>

      {!collapsed && (
        <ul className="divide-y divide-qb-border-light border-t border-qb-border-light">
          {group.expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              expanded={expandedId === expense.id}
              onToggle={() => onToggleExpense(expense.id)}
              onRemove={() => onRemove(expense.id)}
              onUpdate={onUpdate}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export function ExpenseList({
  expenses,
  dateSort: dateSortProp,
  onDateSortChange,
  onRemove,
  onUpdate,
}: ExpenseListProps) {
  const [groupMode, setGroupMode] = useState<ExpenseGroupMode>("month");
  const [internalDateSort, setInternalDateSort] =
    useState<ExpenseDateSort>("newest");
  const dateSort = dateSortProp ?? internalDateSort;
  const setDateSort = onDateSortChange ?? setInternalDateSort;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pendingCount = expenses.filter(
    (expense) => expense.accountingStatus === "pending",
  ).length;
  const woMissingCount = countMissingWorkOrders(expenses);

  const groups = useMemo(
    () => groupExpenses(expenses, groupMode, dateSort),
    [expenses, groupMode, dateSort],
  );

  const handleToggleExpense = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const handleRemove = (id: string) => {
    if (expandedId === id) setExpandedId(null);
    onRemove(id);
  };

  if (expenses.length === 0) {
    return (
      <section className="qb-card overflow-hidden">
        <div className="qb-card-header flex items-center gap-2.5 py-3 lg:py-4">
          <IconExpenses className="h-4 w-4 text-qb-blue" />
          <h2 className="text-base font-bold text-qb-text lg:text-lg">
            Receipt folders
          </h2>
        </div>
        <div className="flex flex-col items-center px-5 py-10 text-center lg:px-6 lg:py-12">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-qb-bg">
            <IconExpenses className="h-7 w-7 text-qb-text-muted" />
          </div>
          <p className="font-semibold text-qb-text">No expenses recorded</p>
          <p className="mt-1 max-w-xs text-sm text-qb-text-secondary">
            Scan your first receipt — sorting above applies once receipts are
            saved.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="qb-card overflow-hidden">
      <div className="qb-card-header flex flex-col gap-3 py-3 lg:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <IconExpenses className="h-4 w-4 text-qb-blue" />
            <h2 className="text-base font-bold text-qb-text lg:text-lg">
              Receipt folders
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {woMissingCount > 0 ? (
              <span className="rounded bg-[#fef9c3] px-2 py-0.5 text-xs font-semibold text-[#a16207]">
                {woMissingCount} WO missing
              </span>
            ) : null}
            {pendingCount > 0 ? (
              <span className="rounded bg-qb-blue-light px-2 py-0.5 text-xs font-semibold text-qb-blue-dark">
                {pendingCount} pending
              </span>
            ) : null}
            <span className="rounded bg-qb-bg px-2 py-0.5 text-xs font-semibold tabular-nums text-qb-text-secondary">
              {expenses.length}
            </span>
          </div>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Group receipts by"
        >
          {(Object.keys(GROUP_MODE_LABELS) as ExpenseGroupMode[]).map(
            (mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={groupMode === mode}
                onClick={() => setGroupMode(mode)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  groupMode === mode
                    ? "bg-qb-blue text-white"
                    : "border border-qb-border bg-qb-surface text-qb-text-secondary hover:bg-qb-bg"
                }`}
              >
                {GROUP_MODE_LABELS[mode]}
              </button>
            ),
          )}
        </div>

        <ExpenseExportButton
          expenses={expenses}
          dateSort={dateSort}
          className="rounded-lg border border-qb-border bg-qb-bg/60 p-3"
        />
      </div>

      <p className="border-b border-qb-border-light px-4 py-2 text-xs text-qb-text-muted lg:px-5">
        {groupMode === "month" &&
          "Grouped by receipt month and year. Use the month/year filter above."}
        {groupMode === "billable" &&
          "Grouped by billable status. Approve receipts before sending to accounting."}
        {groupMode === "date" &&
          "Flat list sorted by receipt date using the sort control above."}
        {groupMode === "workorder" &&
          "Billable receipts grouped by AppFolio work order. Missing WOs appear in the WO missing folder."}
      </p>

      <div>
        {groupMode === "date" ? (
          <ul className="divide-y divide-qb-border-light">
            {groups[0]?.expenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                expanded={expandedId === expense.id}
                onToggle={() => handleToggleExpense(expense.id)}
                onRemove={() => handleRemove(expense.id)}
                onUpdate={onUpdate}
              />
            ))}
          </ul>
        ) : (
          groups.map((group) => (
            <FolderSection
              key={group.key}
              group={group}
              expandedId={expandedId}
              onToggleExpense={handleToggleExpense}
              onRemove={handleRemove}
              onUpdate={onUpdate}
            />
          ))
        )}
      </div>
    </section>
  );
}
