import type { ScannedReceipt } from "@/lib/types";
import { getUseAgentPipeline } from "@/lib/agent-scan-preference";
import { mergeScanWithAgent } from "@/lib/agent/merge-scan-with-agent";
import type { ReceiptAgentState } from "@/lib/agent/receipt-state";
import { emitAgentActivity } from "@/lib/live-feed/helpers";
import {
  completePipelineJob,
  emitLiveFeedEvent,
  failPipelineJob,
  upsertPipelineJob,
} from "@/lib/live-feed/store";
import { getOwnerId } from "@/lib/owner-id";
import { prepareReceiptImage } from "@/lib/image-utils";

export interface ScanReceiptResult {
  result: ScannedReceipt;
  thumbnailUrl: string;
}

export interface ScanReceiptOptions {
  scanMode?: "default" | "bulk";
  jobId?: string;
  label?: string;
}

export async function scanReceiptFile(
  file: File,
  options: ScanReceiptOptions = {},
): Promise<ScanReceiptResult> {
  const scanMode = options.scanMode ?? "default";
  const jobId = options.jobId ?? crypto.randomUUID();
  const label = options.label ?? (file.name || "Receipt");

  upsertPipelineJob({
    id: jobId,
    label,
    source: scanMode === "bulk" ? "bulk" : "scan",
    status: "processing",
    stage: "Preparing image",
  });

  emitLiveFeedEvent({
    kind: "scan_started",
    message: `Started scanning ${label}`,
    jobId,
  });

  try {
    const prepared = await prepareReceiptImage(file, scanMode);

    upsertPipelineJob({
      id: jobId,
      label,
      source: scanMode === "bulk" ? "bulk" : "scan",
      status: "processing",
      stage: "Reading receipt (OCR)",
    });

    const quick = await scanReceiptQuick(prepared, scanMode);

    emitLiveFeedEvent({
      kind: "ocr_complete",
      message: `Extracted ${quick.result.merchant} — ${quick.result.amount.toFixed(2)}`,
      jobId,
      meta: {
        merchant: quick.result.merchant,
        amount: quick.result.amount,
      },
    });

    upsertPipelineJob({
      id: jobId,
      label,
      source: scanMode === "bulk" ? "bulk" : "scan",
      status: "processing",
      stage: "Categorized",
      merchant: quick.result.merchant,
      amount: quick.result.amount,
    });

    if (!getUseAgentPipeline()) {
      emitLiveFeedEvent({
        kind: "scan_complete",
        message: `Scan complete — ${quick.result.merchant}`,
        jobId,
        meta: {
          merchant: quick.result.merchant,
          amount: quick.result.amount,
        },
      });
      completePipelineJob(jobId, {
        merchant: quick.result.merchant,
        amount: quick.result.amount,
        stage: "Scan complete",
      });
      return quick;
    }

    const expenseId = crypto.randomUUID();

    upsertPipelineJob({
      id: jobId,
      label,
      source: "agent",
      status: "processing",
      stage: "Agent workflow",
      merchant: quick.result.merchant,
      amount: quick.result.amount,
      expenseId,
    });

    const formData = new FormData();
    formData.append("image", prepared.uploadFile);
    formData.append("extracted", JSON.stringify(quick.result));
    formData.append("expenseId", expenseId);
    formData.append("ownerId", getOwnerId());

    const response = await fetch("/api/process-receipt", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 503 && data.fallback === "/api/scan-receipt") {
        emitLiveFeedEvent({
          kind: "scan_complete",
          message: `Agent unavailable — saved scan for ${quick.result.merchant}`,
          jobId,
        });
        completePipelineJob(jobId, {
          merchant: quick.result.merchant,
          amount: quick.result.amount,
          stage: "Scan complete (no agent)",
        });
        return quick;
      }
      throw new Error(data.error ?? "Agent workflow failed");
    }

    const agentState = data.agent as ReceiptAgentState;
    emitAgentActivity(jobId, agentState, expenseId);

    const merged = mergeScanWithAgent(
      quick.result,
      agentState,
      {
        expenseId,
        receiptImage: prepared.previewUrl,
      },
    );

    emitLiveFeedEvent({
      kind: "scan_complete",
      message: `Pipeline complete — ${merged.merchant}`,
      jobId,
      expenseId,
      meta: {
        merchant: merged.merchant,
        amount: merged.amount,
      },
    });

    completePipelineJob(jobId, {
      merchant: merged.merchant,
      amount: merged.amount,
      expenseId,
      stage: "Agent complete",
    });

    return {
      result: merged,
      thumbnailUrl: prepared.previewUrl,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Receipt scan failed";
    failPipelineJob(jobId, message);
    throw error;
  }
}

async function scanReceiptQuick(
  prepared: Awaited<ReturnType<typeof prepareReceiptImage>>,
  scanMode: "default" | "bulk",
): Promise<ScanReceiptResult> {
  const formData = new FormData();
  formData.append("image", prepared.uploadFile);
  formData.append("scanMode", scanMode);

  const response = await fetch("/api/scan-receipt", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Scan failed");
  }

  return {
    result: data as ScannedReceipt,
    thumbnailUrl: prepared.previewUrl,
  };
}

export const MAX_BULK_UPLOAD = 20;
export const BULK_SCAN_CONCURRENCY = 3;

export async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;

  let nextIndex = 0;
  const limit = Math.min(Math.max(1, concurrency), items.length);

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => runWorker()));
}
