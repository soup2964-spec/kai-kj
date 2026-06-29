interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export type ReceiptImagePrepMode = "default" | "bulk";

const UPLOAD_PROFILES: Record<ReceiptImagePrepMode, CompressOptions> = {
  default: {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.85,
    mimeType: "image/jpeg",
  },
  bulk: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.75,
    mimeType: "image/jpeg",
  },
};

const THUMB_OPTS: CompressOptions = {
  maxWidth: 320,
  maxHeight: 320,
  quality: 0.7,
  mimeType: "image/jpeg",
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          "Could not load image. Try taking a new photo or choosing a JPEG/PNG.",
        ),
      );
    };
    img.src = url;
  });
}

function drawCompressedImage(
  img: HTMLImageElement,
  options: CompressOptions,
): { blob: Blob; dataUrl: string } {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.85, mimeType = "image/jpeg" } =
    options;

  let { width, height } = img;
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL(mimeType, quality);
  return { blob: dataUrlToBlob(dataUrl), dataUrl };
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) {
    buffer[index] = bytes.charCodeAt(index);
  }
  return new Blob([buffer], { type: mime });
}

async function compressImage(
  file: File,
  options: CompressOptions,
): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await loadImage(file);
  return drawCompressedImage(img, options);
}

export async function prepareReceiptImage(
  file: File,
  mode: ReceiptImagePrepMode = "default",
) {
  const img = await loadImage(file);
  const upload = drawCompressedImage(img, UPLOAD_PROFILES[mode]);
  const thumbnail = drawCompressedImage(img, THUMB_OPTS);

  const uploadFile = new File(
    [upload.blob],
    file.name.replace(/\.[^.]+$/, "") + ".jpg",
    { type: "image/jpeg" },
  );

  return {
    uploadFile,
    previewUrl: upload.dataUrl,
    thumbnailUrl: thumbnail.dataUrl,
  };
}
