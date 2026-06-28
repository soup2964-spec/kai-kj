"use client";

import { Suspense, useEffect, useState } from "react";
import { IconSpark } from "@/components/icons";
import { GoogleSheetsConnectCard } from "@/components/dashboard/GoogleSheetsConnectCard";
import { GoogleSheetsLayoutMapper } from "@/components/dashboard/GoogleSheetsLayoutMapper";
import { NotifyConnectCard } from "@/components/dashboard/NotifyConnectCard";
import {
  getUseAgentPipeline,
  setUseAgentPipeline,
} from "@/lib/agent-scan-preference";

export function AgentSettingsPage() {
  const [useAgent, setUseAgent] = useState(false);

  useEffect(() => {
    setUseAgent(getUseAgentPipeline());
  }, []);

  function handleAgentToggle(enabled: boolean) {
    setUseAgent(enabled);
    setUseAgentPipeline(enabled);
  }

  return (
    <div className="space-y-6">
      <section className="qb-card overflow-hidden">
        <div className="qb-card-header flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-qb-blue-light">
            <IconSpark className="h-4 w-4 text-qb-blue" />
          </div>
          <div>
            <h2 className="qb-section-title">Receipt agent</h2>
            <p className="qb-section-desc">
              Optional full pipeline: extract receipt data, match work orders,
              write to Google Sheets, and alert your team when action is needed.
            </p>
          </div>
        </div>

        <div className="qb-card-body space-y-4">
          <div className="rounded-lg border border-qb-border bg-qb-bg px-4 py-3 text-sm text-qb-text-secondary">
            <p className="font-semibold text-qb-text">ORANGE / GREEN workflow</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed">
              <li>
                <span className="font-medium text-amber-800">ORANGE</span> —
                billable receipt missing a work order; team gets Slack or email
                alerts.
              </li>
              <li>
                <span className="font-medium text-emerald-800">GREEN</span> —
                work order confirmed; row is ready for accounting and statement
                reconciliation.
              </li>
            </ul>
            <p className="mt-3 text-xs text-qb-text-muted">
              Quick scan (default) only extracts and categorizes receipts locally.
              Enable the agent below to run the full pipeline when you scan.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-qb-border bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={useAgent}
              onChange={(event) => handleAgentToggle(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-qb-border text-qb-blue"
            />
            <span>
              <span className="block text-sm font-semibold text-qb-text">
                Use full agent when scanning receipts
              </span>
              <span className="mt-0.5 block text-xs text-qb-text-muted">
                Requires the Python agent service (AGENT_SERVICE_URL). Falls back
                to quick scan if the agent is unavailable.
              </span>
            </span>
          </label>
        </div>
      </section>

      <GoogleSheetsConnectCard />
      <GoogleSheetsLayoutMapper />
      <Suspense fallback={null}>
        <NotifyConnectCard />
      </Suspense>
    </div>
  );
}
