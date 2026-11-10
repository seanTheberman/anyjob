const TARGET_IMAGE_BYTES = Math.floor(4.75 * 1024 * 1024);

type BrowserImageSource = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

async function loadBrowserImage(file: File): Promise<BrowserImageSource> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.src = objectUrl;
  await image.decode();
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(objectUrl),
  };
}

function canvasJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("The browser could not compress this image.")),
      "image/jpeg",
      quality,
    );
  });
}

export async function optimizeBrowserImage(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size <= TARGET_IMAGE_BYTES) {
    return file;
  }

  let loaded: BrowserImageSource;
  try {
    loaded = await loadBrowserImage(file);
  } catch {
    // Direct Cloudinary uploads still support formats the browser cannot decode locally.
    return file;
  }

  const attempts = [
    { maxDimension: 2560, quality: 0.84 },
    { maxDimension: 2200, quality: 0.72 },
    { maxDimension: 1900, quality: 0.6 },
    { maxDimension: 1600, quality: 0.48 },
    { maxDimension: 1280, quality: 0.38 },
    { maxDimension: 960, quality: 0.3 },
  ];
  let smallest: Blob | null = null;

  try {
    for (const attempt of attempts) {
      const scale = Math.min(1, attempt.maxDimension / Math.max(loaded.width, loaded.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(loaded.width * scale));
      canvas.height = Math.max(1, Math.round(loaded.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("The browser could not prepare this image.");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(loaded.source, 0, 0, canvas.width, canvas.height);
      const blob = await canvasJpeg(canvas, attempt.quality);
      smallest = !smallest || blob.size < smallest.size ? blob : smallest;
      if (blob.size <= TARGET_IMAGE_BYTES) break;
    }
  } finally {
    loaded.cleanup();
  }

  if (!smallest || smallest.size >= file.size) return file;
  const baseName = file.name.replace(/\.[^.]+$/, "") || "anyjob-photo";
  return new File([smallest], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}
