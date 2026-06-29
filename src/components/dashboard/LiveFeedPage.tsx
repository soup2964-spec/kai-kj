"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { BillableBadge } from "@/components/BillableBadge";
import { ReceiptImageViewer } from "@/components/ReceiptImageViewer";
import { IconReceipt, IconSpark } from "@/components/icons";
import { formatCurrency } from "@/lib/categories";
import { useExpenseContext } from "@/lib/expense-context";
import {
  describePipelineExpense,
  formatFeedTime,
  getPendingPipelineExpenses,
} from "@/lib/live-feed/helpers";
import { useLiveFeed } from "@/lib/live-feed/context";
import type { LiveFeedEventKind } from "@/lib/live-feed/store";

function eventTone(kind: LiveFeedEventKind): string {
  if (kind === "scan_failed" || kind === "bulk_item_error") {
    return "border-qb-danger/30 bg-qb-danger-bg text-qb-danger";
  }
  if (kind.startsWith("agent") || kind === "scan_complete" || kind === "expense_saved") {
    return "border-qb-blue/20 bg-qb-blue-light text-qb-blue-dark";
  }
  if (kind.startsWith("bulk")) {
    return "border-qb-border bg-qb-bg text-qb-text-secondary";
  }
  return "border-qb-border bg-white text-qb-text-secondary";
}

function eventLabel(kind: LiveFeedEventKind): string {
  switch (kind) {
    case "scan_started":
      return "Scan";
    case "ocr_complete":
      return "OCR";
    case "agent_started":
      return "Agent";
    case "agent_step":
      return "Agent step";
    case "agent_complete":
      return "Agent done";
    case "scan_complete":
      return "Complete";
    case "scan_failed":
      return "Failed";
    case "expense_saved":
      return "Saved";
    case "expense_updated":
      return "Updated";
    case "bulk_started":
      return "Bulk";
    case "bulk_item_processing":
      return "Bulk scan";
    case "bulk_item_complete":
      return "Bulk saved";
    case "bulk_item_error":
      return "Bulk error";
    case "bulk_complete":
      return "Bulk done";
    default:
      return "Activity";
  }
}

function jobStatusLabel(status: string): string {
  if (status === "processing") return "Processing";
  if (status === "queued") return "Queued";
  if (status === "error") return "Failed";
  return "Complete";
}

export function LiveFeedPage() {
  const { expenses } = useExpenseContext();
  const { jobs, events } = useLiveFeed();

  const activeJobs = useMemo(
    () =>
      jobs.filter(
        (job) => job.status === "queued" || job.status === "processing",
      ),
    [jobs],
  );

  const pendingExpenses = useMemo(
    () => getPendingPipelineExpenses(expenses),
    [expenses],
  );

  const agentEvents = useMemo(
    () => events.filter((event) => event.kind.startsWith("agent")).length,
    [events],
  );

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Active jobs", activeJobs.length],
          ["Pending in pipeline", pendingExpenses.length],
          ["Agent events", agentEvents],
        ].map(([label, value]) => (
          <div key={label} className="qb-stat">
            <p className="qb-stat-label">{label}</p>
            <p className="qb-stat-value">{value}</p>
          </div>
        ))}
      </section>

      <section className="qb-card">
        <div className="qb-card-header">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-qb-blue opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-qb-blue" />
            </span>
            <h2 className="text-base font-bold text-qb-text">Active pipeline</h2>
          </div>
          <p className="mt-1 text-sm text-qb-text-secondary">
            Receipts and agent jobs currently running.
          </p>
        </div>
        <div className="qb-card-body">
          {activeJobs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-qb-border bg-qb-bg px-4 py-8 text-center">
              <p className="text-sm font-semibold text-qb-text-secondary">
                No active jobs
              </p>
              <p className="mt-1 text-xs text-qb-text-muted">
                Start a scan or bulk upload to see live progress here.
              </p>
              <Link href="/dashboard/scan" className="qb-btn-primary mt-4 inline-flex text-sm">
                Scan receipts
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {activeJobs.map((job) => (
                <li
                  key={job.id}
                  className="rounded-lg border border-qb-border bg-qb-surface px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-qb-text">
                        {job.merchant ?? job.label}
                      </p>
                      <p className="mt-1 text-xs text-qb-text-muted">{job.stage}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-qb-border bg-qb-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-qb-text-secondary">
                      {jobStatusLabel(job.status)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-qb-text-muted">
                    <span className="capitalize">{job.source}</span>
                    {typeof job.amount === "number" ? (
                      <span className="font-semibold tabular-nums text-qb-text">
                        {formatCurrency(job.amount)}
                      </span>
                    ) : (
                      <span>{formatFeedTime(job.updatedAt)}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="qb-card">
        <div className="qb-card-header flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-qb-text">Pending expenses</h2>
            <p className="mt-1 text-sm text-qb-text-secondary">
              Saved receipts still moving through review, accounting, or reconciliation.
            </p>
          </div>
          {pendingExpenses.length > 0 ? (
            <Link href="/dashboard/expenses" className="qb-btn-ghost text-sm">
              View all
            </Link>
          ) : null}
        </div>
        <div className="qb-card-body">
          {pendingExpenses.length === 0 ? (
            <p className="text-sm text-qb-text-secondary">
              No pending expenses — pipeline is clear.
            </p>
          ) : (
            <ul className="space-y-3">
              {pendingExpenses.slice(0, 12).map((expense) => (
                <li
                  key={expense.id}
                  className="flex items-start gap-3 rounded-lg border border-qb-border bg-qb-surface px-4 py-3"
                >
                  {expense.receiptImage ? (
                    <ReceiptImageViewer
                      src={expense.receiptImage}
                      alt={expense.merchant}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-qb-border bg-qb-bg">
                      <IconReceipt className="h-4 w-4 text-qb-text-muted" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-qb-text">
                        {expense.merchant}
                      </p>
                      <p className="shrink-0 text-sm font-bold tabular-nums text-qb-text">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-qb-text-muted">
                      {describePipelineExpense(expense)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <CategoryBadge category={expense.category} />
                      <BillableBadge status={expense.billableStatus} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="qb-card">
        <div className="qb-card-header">
          <div className="flex items-center gap-2">
            <IconSpark className="h-4 w-4 text-qb-blue" />
            <h2 className="text-base font-bold text-qb-text">Activity timeline</h2>
          </div>
          <p className="mt-1 text-sm text-qb-text-secondary">
            Scans, agent steps, and saves as they happen.
          </p>
        </div>
        <div className="qb-card-body">
          {events.length === 0 ? (
            <p className="text-sm text-qb-text-secondary">
              Activity will appear here when you scan receipts or run the agent.
            </p>
          ) : (
            <ul className="space-y-2">
              {events.map((event) => (
                <li
                  key={event.id}
                  className={`rounded-lg border px-3 py-2.5 ${eventTone(event.kind)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                        {eventLabel(event.kind)}
                      </p>
                      <p className="mt-0.5 text-sm font-medium">{event.message}</p>
                    </div>
                    <span className="shrink-0 text-[11px] opacity-70">
                      {formatFeedTime(event.timestamp)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
