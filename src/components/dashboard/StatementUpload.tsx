"use client";

import { useRef, useState } from "react";
import { IconCheck, IconStatement, IconX } from "@/components/icons";
import { formatCurrency } from "@/lib/categories";
import { formatCardLabel } from "@/lib/card-last-four";
import { useExpenseContext } from "@/lib/expense-context";
import type { ReconcileSummary } from "@/lib/statement-reconcile";
import type { StatementTransaction, StatementUpload } from "@/lib/statement-types";
import { useStatements } from "@/lib/statement-store";
import {
  applyReconcileToLocalStatements,
  reconcileStatementsRemote,
} from "@/lib/statement-sync";

const STATEMENT_ACCEPT = "application/pdf,.pdf,text/csv,.csv";

function formatPeriod(period: string | null | undefined): string {
  if (!period) return "Unknown period";
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function UploadHistoryItem({ upload }: { upload: StatementUpload }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-qb-border bg-white px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-qb-text">
          {upload.filename}
        </p>
        <p className="mt-0.5 text-xs text-qb-text-muted">
          {upload.transactionCount} transactions ·{" "}
          {formatCardLabel(upload.cardLastFour)} ·{" "}
          {formatPeriod(upload.statementPeriod)}
        </p>
      </div>
      <span className="shrink-0 rounded border border-qb-border bg-qb-bg px-2 py-0.5 text-[11px] font-semibold uppercase text-qb-text-secondary">
        {upload.sourceType}
      </span>
    </li>
  );
}

function PreviewTable({ transactions }: { transactions: StatementTransaction[] }) {
  const preview = transactions.slice(0, 8);

  return (
    <div className="overflow-hidden rounded-lg border border-qb-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-qb-bg text-xs font-semibold uppercase tracking-wide text-qb-text-muted">
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Merchant</th>
            <th className="px-3 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {preview.map((txn) => (
            <tr key={txn.id} className="border-t border-qb-border-light">
              <td className="px-3 py-2 text-qb-text-secondary">{txn.txnDate}</td>
              <td className="max-w-[180px] truncate px-3 py-2 text-qb-text">
                {txn.merchant}
                {txn.matchedExpenseId ? (
                  <span className="ml-1 text-[10px] font-semibold text-emerald-700">
                    matched
                  </span>
                ) : null}
              </td>
              <td className="px-3 py-2 text-right font-medium text-qb-text">
                {formatCurrency(txn.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {transactions.length > preview.length ? (
        <p className="border-t border-qb-border-light bg-qb-bg px-3 py-2 text-xs text-qb-text-muted">
          + {transactions.length - preview.length} more transactions saved
        </p>
      ) : null}
    </div>
  );
}

function ReconcileSummaryCard({ summary }: { summary: ReconcileSummary }) {
  return (
    <div className="rounded-lg border border-qb-border bg-qb-bg px-3 py-2.5 text-sm">
      <p className="font-semibold text-qb-text">
        {summary.matches.length} receipt
        {summary.matches.length === 1 ? "" : "s"} matched to statement lines
      </p>
      <p className="mt-1 text-xs text-qb-text-secondary">
        {summary.unmatchedExpenseCount} receipts still unmatched ·{" "}
        {summary.unmatchedStatementCount} statement lines open
      </p>
    </div>
  );
}

export function StatementUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploads, transactions, uploading, error, uploadStatement, refresh } =
    useStatements();
  const { expenses, mergeReconciledExpenses } = useExpenseContext();
  const [lastResult, setLastResult] = useState<{
    upload: StatementUpload;
    transactions: StatementTransaction[];
    warnings: string[];
  } | null>(null);
  const [reconcileSummary, setReconcileSummary] = useState<ReconcileSummary | null>(
    null,
  );
  const [reconciling, setReconciling] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function runReconciliation(nextTransactions?: StatementTransaction[]) {
    setReconciling(true);
    setLocalError(null);

    try {
      const result = await reconcileStatementsRemote({
        expenses,
        transactions: nextTransactions ?? transactions,
      });
      mergeReconciledExpenses(result.updatedExpenses);
      applyReconcileToLocalStatements(result.updatedTransactions);
      setReconcileSummary(result.summary);
      await refresh();
      return result.summary;
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not reconcile receipts",
      );
      return null;
    } finally {
      setReconciling(false);
    }
  }

  async function handleFileSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    setLocalError(null);
    setLastResult(null);
    setReconcileSummary(null);

    try {
      const result = await uploadStatement(file);
      setLastResult(result);
      const allTransactions = [...result.transactions, ...transactions];
      await runReconciliation(allTransactions);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not upload statement",
      );
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const displayError = localError ?? error;
  const matchedCount = transactions.filter((txn) => txn.matchedExpenseId).length;

  return (
    <>
      <section className="qb-card overflow-hidden">
        <div className="qb-card-header flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-qb-bg">
            <IconStatement className="h-4 w-4 text-qb-text-secondary" />
          </div>
          <div>
            <h2 className="qb-section-title">Upload statements</h2>
            <p className="qb-section-desc">
              Import a credit card statement PDF or CSV so receipts auto-match
              during reconciliation
            </p>
          </div>
        </div>

        <div className="qb-card-body space-y-4">
          <label
            htmlFor="statement-upload-input"
            className={`qb-btn-secondary w-full cursor-pointer ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <IconStatement className="h-4 w-4 text-qb-text-secondary" />
            {uploading ? "Parsing statement…" : "Choose PDF or CSV"}
          </label>

          <input
            ref={inputRef}
            id="statement-upload-input"
            type="file"
            accept={STATEMENT_ACCEPT}
            className="hidden"
            disabled={uploading}
            onChange={(event) => void handleFileSelected(event.target.files)}
          />

          {transactions.length > 0 ? (
            <div className="rounded-lg border border-qb-border bg-qb-bg px-3 py-2.5 text-xs text-qb-text-secondary">
              {transactions.length} statement lines loaded · {matchedCount} matched
              to receipts · {expenses.filter((e) => !e.creditCardReconciled).length}{" "}
              receipts waiting
            </div>
          ) : null}

          <button
            type="button"
            disabled={reconciling || transactions.length === 0 || expenses.length === 0}
            onClick={() => void runReconciliation()}
            className="qb-btn-primary w-full disabled:opacity-50"
          >
            {reconciling ? "Reconciling…" : "Reconcile all receipts"}
          </button>

          <p className="text-xs text-qb-text-muted">
            Matches use card last four, amount, date (±2 days), and merchant name.
            CSV exports are the most reliable format.
          </p>

          {displayError ? (
            <div className="flex items-start gap-2 rounded-lg border border-qb-danger/30 bg-qb-danger-bg px-3 py-2.5 text-sm text-qb-danger">
              <IconX className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{displayError}</span>
            </div>
          ) : null}

          {reconcileSummary ? (
            <ReconcileSummaryCard summary={reconcileSummary} />
          ) : null}

          {lastResult ? (
            <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3">
              <div className="flex items-start gap-2">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-sm font-semibold text-qb-text">
                    {lastResult.upload.transactionCount} transactions imported
                  </p>
                  <p className="mt-0.5 text-xs text-qb-text-secondary">
                    {lastResult.upload.filename} ·{" "}
                    {formatCardLabel(lastResult.upload.cardLastFour)} ·{" "}
                    {formatPeriod(lastResult.upload.statementPeriod)}
                  </p>
                </div>
              </div>

              {lastResult.warnings.length > 0 ? (
                <ul className="space-y-1 text-xs text-qb-text-secondary">
                  {lastResult.warnings.map((warning) => (
                    <li key={warning}>• {warning}</li>
                  ))}
                </ul>
              ) : null}

              <PreviewTable transactions={lastResult.transactions} />
            </div>
          ) : null}
        </div>
      </section>

      {uploads.length > 0 ? (
        <section className="qb-card overflow-hidden">
          <div className="qb-card-header">
            <h2 className="qb-section-title">Recent statements</h2>
            <p className="qb-section-desc">
              Uploaded statements available for receipt reconciliation
            </p>
          </div>
          <div className="qb-card-body">
            <ul className="space-y-2">
              {uploads.slice(0, 10).map((upload) => (
                <UploadHistoryItem key={upload.id} upload={upload} />
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
