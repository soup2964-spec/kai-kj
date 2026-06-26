import type { ScannedReceipt } from "@/lib/types";
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
    thumbnailUrl: prepared.thumbnailUrl,
  };
}

export const MAX_BULK_UPLOAD = 20;
