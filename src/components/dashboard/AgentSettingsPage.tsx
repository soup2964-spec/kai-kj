"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { GoogleSheetsConnectCard } from "@/components/dashboard/GoogleSheetsConnectCard";
import { GoogleSheetsLayoutMapper } from "@/components/dashboard/GoogleSheetsLayoutMapper";
import { IconCheck, IconSpark } from "@/components/icons";
import {
  getUseAgentPipeline,
  setUseAgentPipeline,
} from "@/lib/agent-scan-preference";
import { isGoogleSheetsSyncReady } from "@/lib/google-sheets-setup";
import { useGoogleSheetsIntegration } from "@/lib/integrations-store";

function AgentToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
        enabled ? "bg-qb-blue" : "bg-qb-border"
      }`}
    >
      <span
        className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SetupStep({
  step,
  title,
  description,
  complete,
  optional,
  children,
}: {
  step: number;
  title: string;
  description: string;
  complete: boolean;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-qb-border-light first:border-t-0 first:pt-0 pt-6">
      <div className="mb-4 flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            complete
              ? "bg-emerald-100 text-emerald-800"
              : "bg-qb-blue-light text-qb-blue"
          }`}
        >
          {complete ? <IconCheck className="h-4 w-4" /> : step}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-qb-text">{title}</h3>
            {optional ? (
              <span className="rounded-full bg-qb-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-qb-text-muted">
                Optional
              </span>
            ) : null}
            {complete ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                Ready
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-qb-text-secondary">
            {description}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function AgentSettingsPage() {
  const [useAgent, setUseAgent] = useState(false);
  const { status: sheetsStatus, loaded: sheetsLoaded } =
    useGoogleSheetsIntegration();

  useEffect(() => {
    setUseAgent(getUseAgentPipeline());
  }, []);

  function handleAgentToggle(enabled: boolean) {
    setUseAgent(enabled);
    setUseAgentPipeline(enabled);
  }

  const setup = useMemo(() => {
    const sheetsConnected = Boolean(sheetsStatus?.connected);
    const sheetsReady = isGoogleSheetsSyncReady(sheetsStatus);
    const stepsComplete = [sheetsConnected, sheetsReady].filter(Boolean).length;

    return {
      sheetsConnected,
      sheetsReady,
      layoutReady: sheetsReady,
      stepsComplete,
      readyToRun: sheetsReady,
    };
  }, [sheetsStatus]);

  const loaded = sheetsLoaded;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-qb-border bg-qb-surface shadow-[var(--qb-shadow)]">
        <div className="border-b border-qb-border-light bg-gradient-to-br from-qb-blue-light/80 via-white to-white px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-qb-blue text-white shadow-sm">
                <IconSpark className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-qb-blue">
                  Receipt agent
                </p>
                <h2 className="mt-0.5 text-lg font-bold text-qb-text">
                  Automate after every scan
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-qb-text-secondary">
                  Connect your tools once, then flip the switch. Moodna runs
                  work-order checks and writes to Sheets after each scan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-qb-border bg-white px-4 py-3 sm:shrink-0">
              <div className="text-right">
                <p className="text-sm font-bold text-qb-text">
                  {useAgent ? "Agent active" : "Agent paused"}
                </p>
                <p className="text-xs text-qb-text-muted">
                  {useAgent ? "Runs after each KIE scan" : "Scan-only mode"}
                </p>
              </div>
              <AgentToggle enabled={useAgent} onChange={handleAgentToggle} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              ORANGE — missing work order
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              GREEN — ready for accounting
            </span>
          </div>
        </div>

        <div className="grid gap-px bg-qb-border-light sm:grid-cols-2">
          {[
            {
              label: "Setup progress",
              value: loaded ? `${setup.stepsComplete} / 2` : "…",
              hint: "Integrations configured",
            },
            {
              label: "Google Sheets",
              value: setup.sheetsReady
                ? "Ready"
                : setup.sheetsConnected
                  ? "Needs mapping"
                  : "Not connected",
              hint: setup.sheetsReady
                ? "Syncing to your spreadsheet"
                : "Connect your CC ledger in step 1",
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white px-4 py-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
                {stat.label}
              </p>
              <p className="mt-1 text-sm font-bold text-qb-text">{stat.value}</p>
              <p className="mt-0.5 text-xs text-qb-text-muted">{stat.hint}</p>
            </div>
          ))}
        </div>

        {useAgent && loaded && !setup.readyToRun ? (
          <div className="border-t border-amber-200 bg-amber-50/70 px-5 py-3 text-sm text-amber-950">
            Connect Google Sheets and map your columns before relying on the
            agent in production.
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-xl border border-qb-border bg-qb-surface px-5 py-2 shadow-[var(--qb-shadow)] sm:px-6">
        <div className="border-b border-qb-border-light py-4">
          <h3 className="text-base font-bold text-qb-text">Connect integrations</h3>
          <p className="mt-1 text-sm text-qb-text-secondary">
            Two quick steps. Each user connects their own spreadsheet once.
          </p>
        </div>

        <SetupStep
          step={1}
          title="Google Sheets"
          description="Link your CC ledger so scanned receipts export to your spreadsheet."
          complete={setup.sheetsReady}
        >
          <GoogleSheetsConnectCard embedded />
        </SetupStep>

        <SetupStep
          step={2}
          title="Column mapping"
          description="Match Moodna fields to your existing sheet columns."
          complete={setup.sheetsReady}
        >
          <GoogleSheetsLayoutMapper embedded />
        </SetupStep>
      </section>
    </div>
  );
}
