"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AccountingSyncBadge,
  canSubmitAccountingReview,
} from "@/components/AccountingSyncBadge";
import type { Expense, ReceiptInboxStatus } from "@/lib/types";
import {
  GROUP_MODE_LABELS,
  groupExpenses,
  type ExpenseDateSort,
  type ExpenseGroup,
  type ExpenseGroupMode,
} from "@/lib/expense-grouping";
import {
  expenseToTransactionFields,
  transactionFieldsToPatch,
  type ExpenseTransactionPatch,
} from "@/lib/expense-update";
import { countMissingWorkOrders } from "@/lib/work-order";
import { ExpenseExportButton } from "@/components/ExpenseExportButton";
import { useExpenseContext } from "@/lib/expense-context";
import {
  getMissingInfoReasons,
  INBOX_STATUS_LABELS,
  INBOX_STATUS_ORDER,
  MISSING_INFO_LABELS,
} from "@/lib/receipt-workflow";
import { CategoryBadge } from "./CategoryBadge";
import { BillableBadge } from "./BillableBadge";
import { CardBadge } from "./CardBadge";
import { WorkOrderBadge } from "./WorkOrderBadge";
import { ReceiptLineItemsList } from "./ReceiptLineItemsList";
import { ReceiptImageViewer } from "./ReceiptImageViewer";
import { ReconcileBadge } from "./ReconcileBadge";
import {
  IconChevronDown,
  IconCheck,
  IconExpenses,
  IconReceipt,
  IconTrash,
  IconX,
} from "./icons";
import { formatCurrency, formatDate } from "@/lib/categories";
import { ReceiptTransactionEditForm } from "./ReceiptTransactionEditForm";

interface ExpenseListProps {
  expenses: Expense[];
  dateSort?: ExpenseDateSort;
  onDateSortChange?: (sort: ExpenseDateSort) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: ExpenseTransactionPatch) => void;
}

function MissingInfoBadges({ expense }: { expense: Expense }) {
  const reasons = getMissingInfoReasons(expense);

  if (reasons.length === 0) {
    return (
      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        Complete
      </span>
    );
  }

  return (
    <>
      {reasons.slice(0, 3).map((reason) => (
        <span
          key={reason}
          className="rounded bg-[#fef9c3] px-2 py-0.5 text-[11px] font-semibold text-[#a16207]"
        >
          {MISSING_INFO_LABELS[reason]}
        </span>
      ))}
      {reasons.length > 3 ? (
        <span className="rounded bg-qb-bg px-2 py-0.5 text-[11px] font-semibold text-qb-text-secondary">
          +{reasons.length - 3} more
        </span>
      ) : null}
    </>
  );
}

function InboxStatusBadge({ status }: { status: ReceiptInboxStatus }) {
  const tone =
    status === "needs_review"
      ? "bg-[#fef9c3] text-[#a16207]"
      : status === "reconciled"
        ? "bg-emerald-50 text-emerald-700"
        : status === "exported"
          ? "bg-qb-blue-light text-qb-blue-dark"
          : "bg-qb-bg text-qb-text-secondary";

  return (
    <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {INBOX_STATUS_LABELS[status]}
    </span>
  );
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
  const [transactionFields, setTransactionFields] = useState(() =>
    expenseToTransactionFields(expense),
  );

  useEffect(() => {
    if (expanded) {
      setTransactionFields(expenseToTransactionFields(expense));
    }
  }, [expanded, expense]);

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
            <ReceiptImageViewer src={expense.receiptImage} alt={expense.merchant} />
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
              <InboxStatusBadge status={expense.inboxStatus} />
              <CardBadge lastFour={expense.cardLastFour} brand={expense.cardBrand} />
              <WorkOrderBadge expense={expense} />
              <ReconcileBadge expense={expense} />
              <AccountingSyncBadge status={expense.accountingStatus} />
              <MissingInfoBadges expense={expense} />
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
          {expense.receiptImage ? (
            <div className="rounded-lg border border-qb-border bg-qb-surface p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
                Receipt image
              </p>
              <div className="mt-2">
                <ReceiptImageViewer
                  src={expense.receiptImage}
                  alt={`${expense.merchant} receipt`}
                  variant="panel"
                />
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border border-qb-border bg-qb-surface p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
                  Accounting software
                </p>
                <p className="mt-1 text-sm text-qb-text-secondary">
                  Approve to send this receipt to your connected accounting
                  software. Disapprove keeps it in Moodna only.
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

          <div className="rounded-lg border border-qb-border bg-qb-surface p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
              Transaction details
            </p>
            <p className="mt-1 text-xs text-qb-text-secondary">
              Update merchant, amount, date, category, and other fields after upload.
            </p>
            <div className="mt-3">
              <ReceiptTransactionEditForm
                idPrefix={`expense-${expense.id}`}
                values={transactionFields}
                onChange={setTransactionFields}
                onSave={() =>
                  onUpdate(expense.id, transactionFieldsToPatch(transactionFields))
                }
              />
            </div>
          </div>

          <div>
            <label
              htmlFor={`inbox-${expense.id}`}
              className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted"
            >
              Inbox status
            </label>
            <select
              id={`inbox-${expense.id}`}
              value={expense.inboxStatus}
              onChange={(event) =>
                onUpdate(expense.id, {
                  inboxStatus: event.target.value as ReceiptInboxStatus,
                })
              }
              className="mt-1.5 w-full rounded border border-qb-border bg-qb-surface px-3 py-2 text-sm text-qb-text"
            >
              {INBOX_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {INBOX_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-qb-text-secondary">
              Move receipts from new to review, approved, exported, and reconciled.
            </p>
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
          "Grouped by purchase date on the receipt. Folders use the receipt date, not the upload date."}
        {groupMode === "workorder" &&
          "Billable receipts grouped by AppFolio work order. Missing WOs appear in the WO missing folder."}
      </p>

      <div>
        {groups.map((group) => (
          <FolderSection
            key={group.key}
            group={group}
            expandedId={expandedId}
            onToggleExpense={handleToggleExpense}
            onRemove={handleRemove}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </section>
  );
}
