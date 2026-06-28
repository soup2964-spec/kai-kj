"use client";

import { useMemo, useRef, useState } from "react";
import type { ScannedReceipt } from "@/lib/types";
import { CategoryBadge } from "./CategoryBadge";
import { BillableBadge } from "./BillableBadge";
import { IconCamera, IconCheck, IconPhoto, IconSpark } from "./icons";
import { ScanToast } from "./ScanToast";
import { ReceiptLineItemsList } from "./ReceiptLineItemsList";
import { formatCurrency, formatDate } from "@/lib/categories";
import { prepareReceiptImage } from "@/lib/image-utils";
import { scanReceiptFile } from "@/lib/scan-receipt-client";

type ScanStep = "idle" | "preview" | "scanning" | "result";

interface ReceiptScannerProps {
  onScanComplete: (result: ScannedReceipt, thumbnailUrl: string) => void;
}

export function ReceiptScanner({ onScanComplete }: ReceiptScannerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ScanStep>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScannedReceipt | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [showScannedToast, setShowScannedToast] = useState(false);

  const canSubmit = useMemo(
    () => step === "preview" && Boolean(uploadFile) && !preparing,
    [step, uploadFile, preparing],
  );

  const canSave = useMemo(
    () => step === "result" && Boolean(result && thumbnailUrl),
    [step, result, thumbnailUrl],
  );

  async function handlePhotoSelected(file: File) {
    setError(null);
    setResult(null);
    setPreparing(true);

    try {
      const prepared = await prepareReceiptImage(file);
      setPreview(prepared.previewUrl);
      setUploadFile(prepared.uploadFile);
      setThumbnailUrl(prepared.thumbnailUrl);
      setStep("preview");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load that photo",
      );
      setStep("idle");
    } finally {
      setPreparing(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (libraryInputRef.current) libraryInputRef.current.value = "";
    }
  }

  async function submitReceipt() {
    if (!uploadFile) return;

    setError(null);
    setStep("scanning");

    try {
      const { result: scanned } = await scanReceiptFile(uploadFile);
      setResult(scanned);
      setStep("result");
      setShowScannedToast(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("preview");
    }
  }

  function reset() {
    setStep("idle");
    setPreview(null);
    setUploadFile(null);
    setThumbnailUrl(null);
    setResult(null);
    setError(null);
    setPreparing(false);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (libraryInputRef.current) libraryInputRef.current.value = "";
  }

  function save() {
    if (!result || !thumbnailUrl) return;
    onScanComplete(result, thumbnailUrl);
    reset();
  }

  return (
    <>
      <ScanToast
        visible={showScannedToast}
        onDismiss={() => setShowScannedToast(false)}
      />

      <section className="qb-card overflow-hidden">
      <div className="qb-card-header flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded bg-qb-blue-light">
          <IconCamera className="h-4 w-4 text-qb-blue" />
        </div>
        <div>
          <h2 className="qb-section-title">Scan Receipt</h2>
          <p className="qb-section-desc">
            Capture or upload a receipt to auto-categorize the expense
          </p>
        </div>
      </div>

      <div className="qb-card-body">
        {step === "idle" && (
          <div className="space-y-3">
            <label
              htmlFor="camera-input"
              className="group flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-qb-blue/40 bg-qb-blue-light/50 px-6 py-10 transition hover:border-qb-blue hover:bg-qb-blue-light active:scale-[0.99]"
            >
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-qb-blue text-white shadow-sm transition group-hover:bg-qb-blue-hover">
                <IconCamera className="h-6 w-6" />
              </div>
              <span className="text-base font-bold text-qb-text">
                Take Photo
              </span>
              <span className="mt-1 text-sm text-qb-text-secondary">
                Opens your iPhone camera
              </span>
            </label>

            <label
              htmlFor="library-input"
              className="qb-btn-secondary w-full cursor-pointer"
            >
              <IconPhoto className="h-4 w-4 text-qb-text-secondary" />
              Choose from Photos
            </label>

            {preparing && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-qb-text-secondary">
                <span className="qb-spinner" />
                Preparing photo...
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-qb-danger-bg px-4 py-3 text-sm text-qb-danger">
                {error}
              </div>
            )}

            <input
              id="camera-input"
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only-ios-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handlePhotoSelected(file);
              }}
            />
            <input
              id="library-input"
              ref={libraryInputRef}
              type="file"
              accept="image/*"
              className="sr-only-ios-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handlePhotoSelected(file);
              }}
            />
          </div>
        )}

        {(step === "preview" || step === "scanning" || step === "result") &&
          preview && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-qb-border bg-qb-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="max-h-80 w-full object-contain"
                />
              </div>

              {step === "preview" && (
                <div className="rounded-lg border border-qb-border bg-qb-bg px-4 py-3 text-center text-sm text-qb-text-secondary">
                  Review your receipt, then submit to extract and categorize
                </div>
              )}

              {step === "scanning" && (
                <div className="flex items-center gap-3 rounded-lg border border-qb-border bg-qb-bg px-4 py-3.5 text-sm text-qb-text-secondary">
                  <span className="qb-spinner" />
                  <span>
                    <span className="font-semibold text-qb-text">Processing…</span>
                    {" "}Reading receipt and assigning category
                  </span>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-qb-danger-bg px-4 py-3 text-sm text-qb-danger">
                  {error}
                </div>
              )}

              {step === "result" && result && (
                <div className="qb-animate-in overflow-hidden rounded-lg border border-qb-blue/30 bg-qb-blue-light">
                  <div className="flex items-center gap-2 border-b border-qb-blue/20 bg-white/60 px-4 py-2.5">
                    <IconSpark className="h-4 w-4 text-qb-blue" />
                    <span className="text-xs font-bold uppercase tracking-wider text-qb-blue-dark">
                      Categorized
                    </span>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-qb-text">
                          {result.merchant}
                        </p>
                        <p className="text-sm text-qb-text-secondary">
                          {formatDate(result.date)}
                        </p>
                      </div>
                      <p className="shrink-0 text-2xl font-bold tabular-nums text-qb-text">
                        {formatCurrency(result.amount)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryBadge category={result.category} size="md" />
                      <BillableBadge status={result.billableStatus} size="md" />
                    </div>

                    <p className="text-sm leading-relaxed text-qb-text-secondary">
                      {result.categoryReason}
                    </p>

                    <p className="text-sm leading-relaxed text-qb-text-secondary">
                      {result.billableReason}
                    </p>

                    {result.lineItems.length > 0 && (
                      <ReceiptLineItemsList items={result.lineItems} limit={8} />
                    )}

                    <div className="flex items-center gap-2 text-xs text-qb-text-muted">
                      <IconCheck className="h-3.5 w-3.5 text-qb-blue" />
                      {Math.round(result.confidence * 100)}% confidence
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop: inline actions */}
              <div className="hidden gap-3 pt-1 lg:flex">
                <button
                  type="button"
                  onClick={reset}
                  disabled={step === "scanning"}
                  className="qb-btn-secondary flex-1"
                >
                  Retake
                </button>

                {step === "preview" && (
                  <button
                    type="button"
                    onClick={() => void submitReceipt()}
                    disabled={!canSubmit}
                    className="qb-btn-primary flex-1"
                  >
                    Submit Receipt
                  </button>
                )}

                {step === "result" && (
                  <button
                    type="button"
                    onClick={save}
                    disabled={!canSave}
                    className="qb-btn-primary flex-1"
                  >
                    Save Expense
                  </button>
                )}
              </div>

              {/* iPhone: sticky bottom action bar — always reachable with thumb */}
              <div className="ios-action-bar lg:hidden">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={reset}
                    disabled={step === "scanning"}
                    className="qb-btn-secondary flex-1"
                  >
                    Retake
                  </button>

                  {step === "preview" && (
                    <button
                      type="button"
                      onClick={() => void submitReceipt()}
                      disabled={!canSubmit}
                      className="qb-btn-primary flex-1"
                    >
                      Submit Receipt
                    </button>
                  )}

                  {step === "result" && (
                    <button
                      type="button"
                      onClick={save}
                      disabled={!canSave}
                      className="qb-btn-primary flex-1"
                    >
                      Save Expense
                    </button>
                  )}
                </div>
              </div>

              {/* Spacer so receipt preview isn't hidden behind sticky bar */}
              <div className="h-[calc(72px+env(safe-area-inset-bottom))] lg:hidden" aria-hidden />
            </div>
          )}
      </div>
    </section>
    </>
  );
}
