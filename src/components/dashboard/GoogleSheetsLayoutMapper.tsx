"use client";

import { useEffect, useState } from "react";
import { IconCheck, IconX } from "@/components/icons";
import {
  fetchSheetHeaders,
  useGoogleSheetsIntegration,
} from "@/lib/integrations-store";
import {
  COLUMN_LETTER_OPTIONS,
  mergeSheetsLayoutConfig,
  type CcLedgerFieldKey,
  type SheetsLayoutConfig,
} from "@/lib/sheets-layout";

function previewTabName(pattern: string, sampleCard = "1234"): string {
  return pattern
    .replace(/\{cardLastFour\}/gi, sampleCard)
    .replace(/\{card\}/gi, sampleCard);
}

export function GoogleSheetsLayoutMapper() {
  const { status, saving, saveLayout } = useGoogleSheetsIntegration();
  const [layout, setLayout] = useState<SheetsLayoutConfig | null>(null);
  const [tabSample, setTabSample] = useState("1234");
  const [readTab, setReadTab] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loadingHeaders, setLoadingHeaders] = useState(false);

  useEffect(() => {
    if (status?.layoutConfig) {
      setLayout(mergeSheetsLayoutConfig(status.layoutConfig));
      setReadTab((current) => current || previewTabName(status.layoutConfig.tabPattern));
    }
  }, [status?.layoutConfig]);

  if (!status?.connected || !layout) {
    return null;
  }

  const fieldDefinitions = status.fieldDefinitions ?? [];

  function updateColumn(field: CcLedgerFieldKey, column: string) {
    setLayout((current) => {
      if (!current) return current;
      const columns = { ...current.columns };
      if (!column) {
        delete columns[field];
      } else {
        columns[field] = column;
      }
      return { ...current, columns };
    });
    setSaved(false);
  }

  async function handleReadHeaders(autoMap = false) {
    setLocalError(null);
    setLoadingHeaders(true);

    try {
      const result = await fetchSheetHeaders({
        tab: readTab.trim() || undefined,
        cardLastFour: tabSample.trim() || undefined,
      });
      setHeaders(result.headers);
      setReadTab(result.tab);

      if (autoMap) {
        setLayout((current) =>
          current
            ? mergeSheetsLayoutConfig({
                ...current,
                createMissingTabs: false,
                columns: {
                  ...current.columns,
                  ...result.suggestedColumns,
                },
              })
            : current,
        );
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not read spreadsheet headers",
      );
    } finally {
      setLoadingHeaders(false);
    }
  }

  async function handleSave() {
    setLocalError(null);
    try {
      await saveLayout(mergeSheetsLayoutConfig(layout));
      setSaved(true);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not save column mapping",
      );
    }
  }

  return (
    <section className="qb-card overflow-hidden">
      <div className="qb-card-header">
        <h2 className="qb-section-title">Map your existing sheet</h2>
        <p className="qb-section-desc">
          Tell Moodna which columns in your spreadsheet match each receipt field.
          Required: Expense ID and Sheet status (ORANGE/GREEN).
        </p>
      </div>

      <div className="qb-card-body space-y-4">
        {!status.layoutConfigured ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-sm text-amber-900">
            Column mapping is not saved yet. Read headers from one of your tabs
            and save before the agent writes transactions.
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-qb-text-muted">
              Tab name pattern
            </span>
            <input
              type="text"
              value={layout.tabPattern}
              onChange={(event) => {
                setLayout({ ...layout, tabPattern: event.target.value });
                setSaved(false);
              }}
              className="w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm"
            />
            <span className="text-xs text-qb-text-muted">
              Example: {previewTabName(layout.tabPattern, tabSample || "1234")}
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-qb-text-muted">
              Sample card last four
            </span>
            <input
              type="text"
              value={tabSample}
              maxLength={4}
              onChange={(event) => setTabSample(event.target.value.replace(/\D/g, ""))}
              className="w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-qb-text-muted">
              Header row
            </span>
            <input
              type="number"
              min={1}
              value={layout.headerRow}
              onChange={(event) => {
                setLayout({ ...layout, headerRow: Number(event.target.value) || 1 });
                setSaved(false);
              }}
              className="w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-qb-text-muted">
              First data row
            </span>
            <input
              type="number"
              min={1}
              value={layout.dataStartRow}
              onChange={(event) => {
                setLayout({
                  ...layout,
                  dataStartRow: Number(event.target.value) || 2,
                });
                setSaved(false);
              }}
              className="w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-qb-text-secondary">
          <input
            type="checkbox"
            checked={layout.createMissingTabs}
            onChange={(event) => {
              setLayout({ ...layout, createMissingTabs: event.target.checked });
              setSaved(false);
            }}
          />
          Create missing card tabs automatically
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={readTab}
            onChange={(event) => setReadTab(event.target.value)}
            placeholder="Tab to read headers from (e.g. CC-1234)"
            className="flex-1 rounded-lg border border-qb-border bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={loadingHeaders}
            onClick={() => void handleReadHeaders(true)}
            className="qb-btn-secondary shrink-0 disabled:opacity-50"
          >
            {loadingHeaders ? "Reading…" : "Auto-map from headers"}
          </button>
        </div>

        {headers.length > 0 ? (
          <p className="text-xs text-qb-text-muted">
            Headers on {readTab}: {headers.filter(Boolean).join(" · ") || "(empty row)"}
          </p>
        ) : null}

        <div className="overflow-hidden rounded-lg border border-qb-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-qb-bg text-xs font-semibold uppercase tracking-wide text-qb-text-muted">
              <tr>
                <th className="px-3 py-2">Moodna field</th>
                <th className="px-3 py-2">Your column</th>
              </tr>
            </thead>
            <tbody>
              {fieldDefinitions.map((field) => (
                <tr key={field.key} className="border-t border-qb-border-light">
                  <td className="px-3 py-2">
                    <span className="font-medium text-qb-text">{field.label}</span>
                    {field.required ? (
                      <span className="ml-2 text-[11px] font-semibold uppercase text-qb-danger">
                        Required
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={layout.columns[field.key] ?? ""}
                      onChange={(event) =>
                        updateColumn(field.key, event.target.value)
                      }
                      className="w-full rounded border border-qb-border bg-white px-2 py-1.5 text-sm"
                    >
                      <option value="">— Skip —</option>
                      {COLUMN_LETTER_OPTIONS.map((letter) => (
                        <option key={letter} value={letter}>
                          {letter}
                          {headers.length > 0 && headers[COLUMN_LETTER_OPTIONS.indexOf(letter)]
                            ? ` · ${headers[COLUMN_LETTER_OPTIONS.indexOf(letter)]}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="qb-btn-primary w-full disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save column mapping"}
        </button>

        {saved ? (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2.5 text-sm text-emerald-800">
            <IconCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Column mapping saved. The agent will write to your columns.
          </div>
        ) : null}

        {localError ? (
          <div className="flex items-start gap-2 rounded-lg border border-qb-danger/30 bg-qb-danger-bg px-3 py-2.5 text-sm text-qb-danger">
            <IconX className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{localError}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
