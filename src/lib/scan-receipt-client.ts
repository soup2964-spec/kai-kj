import type { ScannedReceipt } from "@/lib/types";
import { getUseAgentPipeline } from "@/lib/agent-scan-preference";
import { mergeScanWithAgent } from "@/lib/agent/merge-scan-with-agent";
import type { ReceiptAgentState } from "@/lib/agent/receipt-state";
import { getOwnerId } from "@/lib/owner-id";
import { prepareReceiptImage } from "@/lib/image-utils";

export interface ScanReceiptResult {
  result: ScannedReceipt;
  thumbnailUrl: string;
}

export interface ScanReceiptOptions {
  scanMode?: "default" | "bulk";
}

export async function scanReceiptFile(
  file: File,
  options: ScanReceiptOptions = {},
): Promise<ScanReceiptResult> {
  const scanMode = options.scanMode ?? "default";
  const prepared = await prepareReceiptImage(file, scanMode);
  const quick = await scanReceiptQuick(prepared, scanMode);

  if (!getUseAgentPipeline()) {
    return quick;
  }

  const expenseId = crypto.randomUUID();
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
      return quick;
    }
    throw new Error(data.error ?? "Agent workflow failed");
  }

  const merged = mergeScanWithAgent(
    quick.result,
    data.agent as ReceiptAgentState,
    {
      expenseId,
      receiptImage: prepared.previewUrl,
    },
  );

  return {
    result: merged,
    thumbnailUrl: prepared.previewUrl,
  };
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
