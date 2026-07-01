"use client";

import Link from "next/link";
import {
  GOOGLE_SHEETS_SETUP_STEPS,
  INTEGRATIONS_SETTINGS_PATH,
  getGoogleSheetsSetupPhase,
  googleSheetsSetupSummary,
  isGoogleSheetsSyncReady,
} from "@/lib/google-sheets-setup";
import { useGoogleSheetsIntegration } from "@/lib/integrations-store";

export function GoogleSheetsSetupBanner({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { status, loaded } = useGoogleSheetsIntegration();

  if (!loaded || isGoogleSheetsSyncReady(status)) {
    return null;
  }

  const phase = getGoogleSheetsSetupPhase(status);

  if (compact) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        <p className="font-semibold">Connect Google Sheets to sync transactions</p>
        <p className="mt-1 text-amber-900/90">{googleSheetsSetupSummary(status)}</p>
        <Link
          href={INTEGRATIONS_SETTINGS_PATH}
          className="mt-2 inline-flex text-sm font-semibold text-qb-blue underline"
        >
          Open setup guide
        </Link>
      </div>
    );
  }

  return (
    <section className="qb-card overflow-hidden border-amber-200 bg-amber-50/40">
      <div className="qb-card-header">
        <h2 className="qb-section-title">Set up Google Sheets (once per account)</h2>
        <p className="qb-section-desc">{googleSheetsSetupSummary(status)}</p>
      </div>
      <div className="qb-card-body space-y-4">
        <ol className="space-y-3">
          {GOOGLE_SHEETS_SETUP_STEPS.map((step) => {
            const complete =
              (step.step === 1 && Boolean(status?.serviceAccountEmail)) ||
              (step.step === 2 && Boolean(status?.connected)) ||
              (step.step === 3 && Boolean(status?.layoutConfigured && status?.layoutValid));

            return (
              <li
                key={step.step}
                className="flex gap-3 rounded-lg border border-qb-border bg-white px-3 py-3"
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    complete
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-qb-blue-light text-qb-blue"
                  }`}
                >
                  {complete ? "✓" : step.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-qb-text">{step.title}</p>
                  <p className="mt-0.5 text-xs text-qb-text-secondary">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {status?.serviceAccountEmail ? (
          <div className="rounded-lg border border-qb-border bg-qb-bg px-3 py-2.5 text-sm">
            <p className="font-semibold text-qb-text">Share your sheet with</p>
            <p className="mt-1 break-all font-mono text-xs text-qb-text-secondary">
              {status.serviceAccountEmail}
            </p>
          </div>
        ) : null}

        {phase === "needs_mapping" && status?.connected ? (
          <p className="text-sm text-qb-text-secondary">
            Your spreadsheet is connected. Finish column mapping on the Integrations
            page to start syncing.
          </p>
        ) : null}

        <Link href={INTEGRATIONS_SETTINGS_PATH} className="qb-btn-primary inline-flex text-sm">
          {status?.connected ? "Finish column mapping" : "Connect your spreadsheet"}
        </Link>
      </div>
    </section>
  );
}
