import type { ScannedReceipt } from "@/lib/types";
import { getUseAgentPipeline } from "@/lib/agent-scan-preference";
import { getOwnerId } from "@/lib/owner-id";
import { prepareReceiptImage } from "@/lib/image-utils";

export interface ScanReceiptResult {
  result: ScannedReceipt;
  thumbnailUrl: string;
}

export async function scanReceiptFile(
  file: File,
): Promise<ScanReceiptResult> {
  const prepared = await prepareReceiptImage(file);
  const formData = new FormData();
  formData.append("image", prepared.uploadFile);

  if (getUseAgentPipeline()) {
    formData.append("ownerId", getOwnerId());

    const response = await fetch("/api/process-receipt", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 503 && data.fallback === "/api/scan-receipt") {
        return scanReceiptQuick(prepared);
      }
      throw new Error(data.error ?? "Agent scan failed");
    }

    return {
      result: data.expense as ScannedReceipt,
      thumbnailUrl: prepared.previewUrl,
    };
  }

  return scanReceiptQuick(prepared);
}

async function scanReceiptQuick(
  prepared: Awaited<ReturnType<typeof prepareReceiptImage>>,
): Promise<ScanReceiptResult> {
  const formData = new FormData();
  formData.append("image", prepared.uploadFile);

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
