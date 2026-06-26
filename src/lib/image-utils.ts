interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

const DEFAULT_UPLOAD_OPTS: CompressOptions = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.85,
  mimeType: "image/jpeg",
};

const DEFAULT_THUMB_OPTS: CompressOptions = {
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

async function compressImage(
  file: File,
  options: CompressOptions,
): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await loadImage(file);
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

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Could not compress image"));
      },
      mimeType,
      quality,
    );
  });

  const dataUrl = canvas.toDataURL(mimeType, quality);
  return { blob, dataUrl };
}

export async function prepareReceiptImage(file: File) {
  const [upload, thumbnail] = await Promise.all([
    compressImage(file, DEFAULT_UPLOAD_OPTS),
    compressImage(file, DEFAULT_THUMB_OPTS),
  ]);

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
