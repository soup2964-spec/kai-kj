"use client";

import { useRef, useState } from "react";
import type { ScannedReceipt } from "@/lib/types";
import { CategoryBadge } from "./CategoryBadge";
import { BillableBadge } from "./BillableBadge";
import { IconPhoto } from "./icons";
import { formatCurrency } from "@/lib/categories";
import {
  BULK_UPLOAD_ACCEPT,
  expandFilesForBulkUpload,
} from "@/lib/bulk-upload-files";
import {
  BULK_SCAN_CONCURRENCY,
  MAX_BULK_UPLOAD,
  runWithConcurrency,
  scanReceiptFile,
} from "@/lib/scan-receipt-client";

type QueueStatus = "pending" | "processing" | "done" | "error";

interface QueueItem {
  id: string;
  file: File | null;
  previewUrl: string | null;
  label: string;
  status: QueueStatus;
  result?: ScannedReceipt;
  error?: string;
}

interface BulkUploadProps {
  onScanComplete: (result: ScannedReceipt, thumbnailUrl: string) => void;
}

function revokeQueuePreviews(items: QueueItem[]) {
  for (const item of items) {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  }
}

export function BulkUpload({ onScanComplete }: BulkUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [active, setActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    revokeQueuePreviews(queue);
    setActive(true);
    setPreparing(true);
    setProcessing(false);
    setCurrentIndex(0);
    setQueue([]);

    let entries;
    try {
      entries = await expandFilesForBulkUpload(fileList);
    } catch (err) {
      setPreparing(false);
      setQueue([
        {
          id: crypto.randomUUID(),
          file: null,
          previewUrl: null,
          label: "Upload",
          status: "error",
          error:
            err instanceof Error ? err.message : "Could not prepare files",
        },
      ]);
      return;
    }

    const items: QueueItem[] = entries.map((entry) => {
      if (entry.status === "error") {
        return {
          id: crypto.randomUUID(),
          file: null,
          previewUrl: null,
          label: entry.label,
          status: "error",
          error: entry.error,
        };
      }

      return {
        id: crypto.randomUUID(),
        file: entry.file,
        previewUrl: URL.createObjectURL(entry.file),
        label: entry.label,
        status: "pending",
      };
    });

    setQueue(items);
    setPreparing(false);

    const scannable = items.filter((item) => item.status === "pending");
    if (scannable.length === 0) {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setProcessing(true);
    let completed = 0;

    await runWithConcurrency(scannable, BULK_SCAN_CONCURRENCY, async (item) => {
      if (!item.file) return;

      setQueue((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, status: "processing" } : entry,
        ),
      );

      try {
        const { result, thumbnailUrl } = await scanReceiptFile(item.file, {
          scanMode: "bulk",
        });
        onScanComplete(result, thumbnailUrl);
        completed += 1;
        setCurrentIndex(completed);
        setQueue((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? { ...entry, status: "done", result }
              : entry,
          ),
        );
      } catch (err) {
        completed += 1;
        setCurrentIndex(completed);
        setQueue((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: "error",
                  error:
                    err instanceof Error ? err.message : "Scan failed",
                }
              : entry,
          ),
        );
      }
    });

    setProcessing(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function reset() {
    revokeQueuePreviews(queue);
    setQueue([]);
    setActive(false);
    setProcessing(false);
    setPreparing(false);
    setCurrentIndex(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  const doneCount = queue.filter((item) => item.status === "done").length;
  const errorCount = queue.filter((item) => item.status === "error").length;
  const progressTotal = queue.filter((item) => item.file).length;
  const progressDone = queue.filter(
    (item) =>
      item.file && (item.status === "done" || item.status === "error"),
  ).length;

  return (
    <section className="qb-card overflow-hidden">
      <div className="qb-card-header flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded bg-qb-bg">
          <IconPhoto className="h-4 w-4 text-qb-text-secondary" />
        </div>
        <div>
          <h2 className="qb-section-title">Bulk Upload</h2>
          <p className="qb-section-desc">
            Upload many receipt photos at once, or one PDF/ZIP with multiple
            receipts inside
          </p>
        </div>
      </div>

      <div className="qb-card-body space-y-4">
        {!active && (
          <label
            htmlFor="bulk-upload-input"
            className="qb-btn-secondary w-full cursor-pointer"
          >
            <IconPhoto className="h-4 w-4 text-qb-text-secondary" />
            Choose Files
          </label>
        )}

        {active && (
          <>
            <div className="rounded-lg border border-qb-border bg-qb-bg px-4 py-3">
              <p className="text-sm font-semibold text-qb-text">
                {preparing
                  ? "Preparing files…"
                  : processing
                    ? `Processing ${currentIndex} of ${progressTotal} (${BULK_SCAN_CONCURRENCY} at a time)…`
                    : `Finished — ${doneCount} saved${errorCount ? `, ${errorCount} failed` : ""}`}
              </p>
              {!processing && !preparing && (
                <p className="mt-1 text-xs text-qb-text-muted">
                  Scanned receipts were added to your transactions.
                </p>
              )}
              {(processing || preparing) && progressTotal > 0 && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-qb-border">
                  <div
                    className="h-full bg-qb-blue transition-all duration-300"
                    style={{
                      width: `${
                        preparing
                          ? 8
                          : progressTotal > 0
                            ? (progressDone / progressTotal) * 100
                            : 100
                      }%`,
                    }}
                  />
                </div>
              )}
            </div>

            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {queue.map((item, index) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-qb-border bg-white p-2.5"
                >
                  {item.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.previewUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded border border-qb-border object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-qb-border bg-qb-bg">
                      <IconPhoto className="h-5 w-5 text-qb-text-muted" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-qb-text-muted">
                      {item.label}
                    </p>
                    {item.status === "pending" && (
                      <p className="text-sm text-qb-text-muted">
                        Waiting… #{index + 1}
                      </p>
                    )}
                    {item.status === "processing" && (
                      <p className="flex items-center gap-2 text-sm font-medium text-qb-text">
                        <span className="qb-spinner" />
                        Scanning…
                      </p>
                    )}
                    {item.status === "done" && item.result && (
                      <>
                        <p className="truncate text-sm font-semibold text-qb-text">
                          {item.result.merchant}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <CategoryBadge category={item.result.category} />
                          <BillableBadge status={item.result.billableStatus} />
                          <span className="text-sm font-bold tabular-nums text-qb-text">
                            {formatCurrency(item.result.amount)}
                          </span>
                        </div>
                      </>
                    )}
                    {item.status === "error" && (
                      <p className="text-sm text-qb-danger">
                        {item.error ?? "Failed to scan"}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${
                      item.status === "done"
                        ? "text-qb-blue"
                        : item.status === "error"
                          ? "text-qb-danger"
                          : "text-qb-text-muted"
                    }`}
                  >
                    {item.status === "done"
                      ? "Saved"
                      : item.status === "error"
                        ? "Error"
                        : item.status === "processing"
                          ? "…"
                          : "Queued"}
                  </span>
                </li>
              ))}
            </ul>

            {!processing && !preparing && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="qb-btn-secondary flex-1"
                >
                  Done
                </button>
                <label
                  htmlFor="bulk-upload-input"
                  className="qb-btn-primary flex-1 cursor-pointer text-center"
                >
                  Upload More
                </label>
              </div>
            )}
          </>
        )}

        <input
          id="bulk-upload-input"
          ref={inputRef}
          type="file"
          accept={BULK_UPLOAD_ACCEPT}
          multiple
          className="sr-only-ios-input"
          onChange={(e) => {
            if (!processing && !preparing) {
              void handleFilesSelected(e.target.files);
            }
          }}
        />

        <p className="text-center text-xs text-qb-text-muted">
          Images, PDFs (one receipt per page), or ZIP files · up to{" "}
          {MAX_BULK_UPLOAD} receipts per batch
        </p>
      </div>
    </section>
  );
}
