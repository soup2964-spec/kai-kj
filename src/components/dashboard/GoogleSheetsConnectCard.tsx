"use client";

import { useState } from "react";
import { IconCheck, IconX } from "@/components/icons";
import { useGoogleSheetsIntegration } from "@/lib/integrations-store";

export function GoogleSheetsConnectCard({ embedded = false }: { embedded?: boolean }) {
  const { status, loaded, error, saving, connect, disconnect } =
    useGoogleSheetsIntegration();
  const [input, setInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleConnect() {
    setLocalError(null);
    try {
      await connect(input);
      setInput("");
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not connect Google Sheets",
      );
    }
  }

  async function handleDisconnect() {
    setLocalError(null);
    try {
      await disconnect();
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not disconnect Google Sheets",
      );
    }
  }

  const displayError = localError ?? error;
  const connected = status?.connected ?? false;
  const unavailable = Boolean(loaded && status && !status.platformSheetsAvailable);

  const content = (
    <>
      {unavailable ? (
          <div className="rounded-lg border border-qb-border bg-qb-bg px-3 py-2.5 text-sm text-qb-text-secondary">
            Google Sheets export is not enabled on this deployment. Your admin
            needs to configure the service account.
          </div>
        ) : null}

        {status?.serviceAccountEmail ? (
          <div className="rounded-lg border border-qb-border bg-qb-bg px-3 py-2.5 text-sm">
            <p className="font-semibold text-qb-text">Share your sheet with</p>
            <p className="mt-1 break-all font-mono text-xs text-qb-text-secondary">
              {status.serviceAccountEmail}
            </p>
            <p className="mt-2 text-xs text-qb-text-muted">
              Give this service account Editor access on your CC ledger
              spreadsheet before connecting.
            </p>
          </div>
        ) : null}

        {connected && status?.spreadsheetUrl ? (
          <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3">
            <div className="flex items-start gap-2">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-qb-text">
                  CC ledger connected
                </p>
                <a
                  href={status.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block truncate text-xs text-emerald-800 underline"
                >
                  {status.spreadsheetUrl}
                </a>
                {status.usingPlatformDefault ? (
                  <p className="mt-1 text-xs text-qb-text-muted">
                    Using platform default spreadsheet (dev only).
                  </p>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => void handleDisconnect()}
              className="qb-btn-secondary text-sm disabled:opacity-50"
            >
              {saving ? "Updating…" : "Disconnect"}
            </button>
          </div>
        ) : (
          <>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-qb-text-muted">
                Spreadsheet URL or ID
              </span>
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm text-qb-text"
                disabled={saving || unavailable}
              />
            </label>

            <button
              type="button"
              disabled={saving || unavailable || !input.trim()}
              onClick={() => void handleConnect()}
              className="qb-btn-primary w-full disabled:opacity-50"
            >
              {saving ? "Connecting…" : "Connect spreadsheet"}
            </button>
          </>
        )}

        <p className="text-xs text-qb-text-muted">
          Connect your spreadsheet, then map your existing columns so the agent
          writes ORANGE/GREEN status and receipt fields where you expect them.
        </p>

        {displayError ? (
          <div className="flex items-start gap-2 rounded-lg border border-qb-danger/30 bg-qb-danger-bg px-3 py-2.5 text-sm text-qb-danger">
            <IconX className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{displayError}</span>
          </div>
        ) : null}
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <section className="qb-card overflow-hidden">
      <div className="qb-card-header">
        <h2 className="qb-section-title">Connect Google Sheets</h2>
        <p className="qb-section-desc">
          Link your CC ledger spreadsheet so the receipt agent can write
          transactions to your account
        </p>
      </div>
      <div className="qb-card-body space-y-4">{content}</div>
    </section>
  );
}
