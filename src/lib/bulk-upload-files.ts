import { MAX_BULK_UPLOAD } from "./scan-receipt-client";

export const BULK_UPLOAD_ACCEPT =
  "image/*,application/pdf,.pdf,application/zip,.zip,application/x-zip-compressed";

export type BulkReceiptEntry =
  | { status: "ready"; file: File; label: string }
  | { status: "error"; label: string; error: string };

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function isZip(file: File): boolean {
  return (
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed" ||
    /\.zip$/i.test(file.name)
  );
}

function isImage(file: File): boolean {
  return (
    file.type.startsWith("image/") ||
    /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name)
  );
}

function imageMimeType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    default:
      return "image/jpeg";
  }
}

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
  return pdfjs;
}

async function pdfToImages(
  file: File,
): Promise<{ file: File; label: string }[]> {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const baseName = file.name.replace(/\.pdf$/i, "") || "document";
  const output: { file: File; label: string }[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas not supported");
    }

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("Could not render PDF page"));
        },
        "image/jpeg",
        0.9,
      );
    });

    output.push({
      file: new File([blob], `${baseName}-page-${pageNum}.jpg`, {
        type: "image/jpeg",
      }),
      label: `${file.name} · page ${pageNum}`,
    });
  }

  if (output.length === 0) {
    throw new Error("That PDF has no pages to scan.");
  }

  return output;
}

async function zipToImages(
  file: File,
): Promise<{ file: File; label: string }[]> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const output: { file: File; label: string }[] = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (!/\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(path)) continue;

    const blob = await entry.async("blob");
    const name = path.split("/").pop() ?? path;
    output.push({
      file: new File([blob], name, {
        type: blob.type || imageMimeType(name),
      }),
      label: `${file.name} → ${name}`,
    });
  }

  if (output.length === 0) {
    throw new Error("No receipt images found in that ZIP file.");
  }

  return output.sort((a, b) => a.label.localeCompare(b.label));
}

async function expandSingleFile(
  file: File,
): Promise<BulkReceiptEntry[]> {
  if (isPdf(file)) {
    try {
      const pages = await pdfToImages(file);
      return pages.map((page) => ({
        status: "ready" as const,
        file: page.file,
        label: page.label,
      }));
    } catch (error) {
      return [
        {
          status: "error",
          label: file.name,
          error:
            error instanceof Error
              ? error.message
              : "Could not read PDF pages",
        },
      ];
    }
  }

  if (isZip(file)) {
    try {
      const images = await zipToImages(file);
      return images.map((image) => ({
        status: "ready" as const,
        file: image.file,
        label: image.label,
      }));
    } catch (error) {
      return [
        {
          status: "error",
          label: file.name,
          error:
            error instanceof Error
              ? error.message
              : "Could not extract ZIP images",
        },
      ];
    }
  }

  if (isImage(file)) {
    return [{ status: "ready", file, label: file.name }];
  }

  return [
    {
      status: "error",
      label: file.name,
      error: "Unsupported file type. Use images, PDF, or ZIP.",
    },
  ];
}

export async function expandFilesForBulkUpload(
  fileList: FileList | File[],
): Promise<BulkReceiptEntry[]> {
  const expanded: BulkReceiptEntry[] = [];
  let readyCount = 0;

  for (const file of Array.from(fileList)) {
    const entries = await expandSingleFile(file);
    for (const entry of entries) {
      if (entry.status === "ready") {
        if (readyCount >= MAX_BULK_UPLOAD) {
          expanded.push({
            status: "error",
            label: entry.label,
            error: `Skipped — bulk upload limit is ${MAX_BULK_UPLOAD} receipts.`,
          });
          continue;
        }
        readyCount += 1;
      }
      expanded.push(entry);
    }
  }

  if (readyCount === 0 && expanded.length === 0) {
    return [
      {
        status: "error",
        label: "Upload",
        error: "No receipt files found. Add images, a PDF, or a ZIP of images.",
      },
    ];
  }

  return expanded;
}

export function countReadyBulkEntries(entries: BulkReceiptEntry[]): number {
  return entries.filter((entry) => entry.status === "ready").length;
}
