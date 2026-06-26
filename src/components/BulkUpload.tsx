"use client";

import { useRef, useState } from "react";
import type { ScannedReceipt } from "@/lib/types";
import { CategoryBadge } from "./CategoryBadge";
import { IconPhoto } from "./icons";
import { formatCurrency } from "@/lib/categories";
import {
  MAX_BULK_UPLOAD,
  scanReceiptFile,
} from "@/lib/scan-receipt-client";

type QueueStatus = "pending" | "processing" | "done" | "error";

interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
  status: QueueStatus;
  result?: ScannedReceipt;
  error?: string;
}

interface BulkUploadProps {
  onScanComplete: (result: ScannedReceipt, thumbnailUrl: string) => void;
}

export function BulkUpload({ onScanComplete }: BulkUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [active, setActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    queue.forEach((item) => URL.revokeObjectURL(item.previewUrl));

    const files = Array.from(fileList).slice(0, MAX_BULK_UPLOAD);
    const items: QueueItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending",
    }));

    setQueue(items);
    setActive(true);
    setProcessing(true);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setCurrentIndex(i + 1);

      setQueue((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, status: "processing" } : entry,
        ),
      );

      try {
        const { result, thumbnailUrl } = await scanReceiptFile(item.file);
        onScanComplete(result, thumbnailUrl);
        setQueue((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? { ...entry, status: "done", result }
              : entry,
          ),
        );
      } catch (err) {
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
    }

    setProcessing(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function reset() {
    queue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setQueue([]);
    setActive(false);
    setProcessing(false);
    setCurrentIndex(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  const doneCount = queue.filter((item) => item.status === "done").length;
  const errorCount = queue.filter((item) => item.status === "error").length;
  const total = queue.length;

  return (
    <section className="qb-card overflow-hidden">
      <div className="qb-card-header flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded bg-qb-bg">
          <IconPhoto className="h-4 w-4 text-qb-text-secondary" />
        </div>
        <div>
          <h2 className="qb-section-title">Bulk Upload</h2>
          <p className="qb-section-desc">
            Select multiple receipt photos to scan and save automatically
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
            Choose Multiple Receipts
          </label>
        )}

        {active && (
          <>
            <div className="rounded-lg border border-qb-border bg-qb-bg px-4 py-3">
              <p className="text-sm font-semibold text-qb-text">
                {processing
                  ? `Processing ${currentIndex} of ${total}…`
                  : `Finished — ${doneCount} saved${errorCount ? `, ${errorCount} failed` : ""}`}
              </p>
              {!processing && (
                <p className="mt-1 text-xs text-qb-text-muted">
                  Scanned receipts were added to your transactions.
                </p>
              )}
              {processing && total > 0 && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-qb-border">
                  <div
                    className="h-full bg-qb-green transition-all duration-300"
                    style={{
                      width: `${((doneCount + errorCount) / total) * 100}%`,
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded border border-qb-border object-cover"
                  />
                  <div className="min-w-0 flex-1">
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
                        ? "text-qb-green"
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

            {!processing && (
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
          accept="image/*"
          multiple
          className="sr-only-ios-input"
          onChange={(e) => {
            if (!processing) void handleFilesSelected(e.target.files);
          }}
        />

        <p className="text-center text-xs text-qb-text-muted">
          Up to {MAX_BULK_UPLOAD} receipts at once
        </p>
      </div>
    </section>
  );
}
