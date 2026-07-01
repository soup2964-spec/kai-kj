"use client";

import { useState } from "react";
import { IconCheck, IconX } from "@/components/icons";
import { useExpenseContext } from "@/lib/expense-context";
import { isGoogleSheetsSyncReady } from "@/lib/google-sheets-setup";
import { useGoogleSheetsIntegration } from "@/lib/integrations-store";
import { GoogleSheetsSetupBanner } from "@/components/dashboard/GoogleSheetsSetupBanner";

export function GoogleSheetsSyncPanel() {
  const { pullFromGoogleSheet, pushToGoogleSheet } = useExpenseContext();
  const { status, loaded } = useGoogleSheetsIntegration();
  const [busy, setBusy] = useState<"pull" | "push" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sheetReady = loaded && isGoogleSheetsSyncReady(status);

  async function handlePull() {
    setBusy("pull");
    setError(null);
    setMessage(null);
    try {
      const result = await pullFromGoogleSheet();
      setMessage(
        `Pulled from Google Sheets — ${result.created} new, ${result.updated} updated.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not pull from Google Sheets",
      );
    } finally {
      setBusy(null);
    }
  }

  async function handlePush() {
    setBusy("push");
    setError(null);
    setMessage(null);
    try {
      const { result } = await pushToGoogleSheet();
      setMessage(
        `Pushed to Google Sheets — ${result.created} added, ${result.updated} updated.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not push to Google Sheets",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="qb-card overflow-hidden">
      <div className="qb-card-header">
        <h2 className="qb-section-title">Google Sheets sync</h2>
        <p className="qb-section-desc">
          Pull or push transactions with your connected CC ledger. Edits and new
          receipts sync automatically when setup is complete.
        </p>
      </div>
      <div className="qb-card-body space-y-4">
        {!loaded ? (
          <p className="text-sm text-qb-text-secondary">Loading sheet settings…</p>
        ) : !sheetReady ? (
          <GoogleSheetsSetupBanner compact />
        ) : (
          <>
            {status?.spreadsheetUrl ? (
              <a
                href={status.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-sm text-qb-blue underline"
              >
                {status.spreadsheetUrl}
              </a>
            ) : null}
            {status?.layoutConfig.fixedTab ? (
              <p className="text-xs text-qb-text-muted">
                Sync tab: <strong>{status.layoutConfig.fixedTab}</strong>
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void handlePull()}
                className="qb-btn-secondary text-sm disabled:opacity-50"
              >
                {busy === "pull" ? "Pulling…" : "Pull from sheet"}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void handlePush()}
                className="qb-btn-primary text-sm disabled:opacity-50"
              >
                {busy === "push" ? "Pushing…" : "Push to sheet"}
              </button>
            </div>
          </>
        )}

        {message ? (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2.5 text-sm text-emerald-800">
            <IconCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-qb-danger/30 bg-qb-danger-bg px-3 py-2.5 text-sm text-qb-danger">
            <IconX className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
