/**
 * lib/image-compress.ts
 * Client-side image compression using Canvas API — zero external dependencies.
 * Works in any modern browser environment (Next.js "use client" components).
 */

export interface CompressOptions {
  /** Max output width in pixels (default 1200) */
  maxWidth?: number;
  /** Max output height in pixels (default 1200) */
  maxHeight?: number;
  /** JPEG/WebP quality 0–1 (default 0.82) */
  quality?: number;
  /** Hard cap on output bytes. Quality is lowered until this is satisfied (default 800 KB) */
  maxBytes?: number;
  /** Output MIME type (default "image/webp", falls back to "image/jpeg") */
  mimeType?: "image/webp" | "image/jpeg";
}

/** Crop an image around a chosen focal point before resizing/compressing it. */
export async function cropImageToAspect(
  source: File | Blob,
  aspectRatio: number,
  positionX = 50,
  positionY = 50,
): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  const sourceAspect = bitmap.width / bitmap.height;
  let cropWidth = bitmap.width;
  let cropHeight = bitmap.height;

  if (sourceAspect > aspectRatio) cropWidth = bitmap.height * aspectRatio;
  else cropHeight = bitmap.width / aspectRatio;

  const cropX = (bitmap.width - cropWidth) * Math.max(0, Math.min(100, positionX)) / 100;
  const cropY = (bitmap.height - cropHeight) * Math.max(0, Math.min(100, positionY)) / 100;
  const scale = Math.min(1, 2400 / Math.max(cropWidth, cropHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(cropWidth * scale));
  canvas.height = Math.max(1, Math.round(cropHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("وێنەکە نەخوێندرایەوە");
  }

  context.drawImage(bitmap, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("نەتوانرا وێنەکە ئامادە بکرێت"));
    }, "image/webp", 0.9);
  });
}

/**
 * Compress and resize an image File/Blob client-side.
 * Returns a Blob with content type matching `mimeType`.
 */
export async function compressImage(
  source: File | Blob,
  opts: CompressOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality: initialQuality = 0.82,
    maxBytes = 800 * 1024, // 800 KB
    mimeType = "image/webp",
  } = opts;

  // ── Load into an HTMLImageElement ─────────────────────────────────────────
  const bitmap = await createImageBitmap(source);
  const { width: origW, height: origH } = bitmap;

  // ── Calculate scaled dimensions ───────────────────────────────────────────
  let outW = origW;
  let outH = origH;
  if (outW > maxWidth) {
    outH = Math.round((outH * maxWidth) / outW);
    outW = maxWidth;
  }
  if (outH > maxHeight) {
    outW = Math.round((outW * maxHeight) / outH);
    outH = maxHeight;
  }

  // ── Draw onto offscreen canvas ────────────────────────────────────────────
  // HTMLCanvasElement works on mobile Safari as well as Chromium browsers;
  // OffscreenCanvas is still missing from some supported mobile webviews.
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, outW, outH);
  bitmap.close();

  // ── Encode with decreasing quality until under maxBytes ───────────────────
  let quality = initialQuality;
  let blob: Blob;

  do {
    blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error("Could not encode image")),
        mimeType,
        quality,
      );
    });
    if (blob.size <= maxBytes) break;
    quality -= 0.05;
  } while (quality > 0.3);

  return blob;
}

/**
 * Preset: avatar — small square-ish, max 200 KB
 */
export function compressAvatar(file: File | Blob): Promise<Blob> {
  return compressImage(file, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.85,
    maxBytes: 200 * 1024,
    mimeType: "image/webp",
  });
}

/**
 * Preset: banner — wide, max 500 KB
 */
export function compressBanner(file: File | Blob): Promise<Blob> {
  return compressImage(file, {
    maxWidth: 1600,
    maxHeight: 600,
    quality: 0.82,
    maxBytes: 500 * 1024,
    mimeType: "image/webp",
  });
}

/**
 * Preset: post image — balanced, max 700 KB
 */
export function compressPostImage(file: File | Blob): Promise<Blob> {
  return compressImage(file, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.84,
    maxBytes: 700 * 1024,
    mimeType: "image/webp",
  });
}

/** Story images use a fixed portrait frame and a bounded upload size. */
export function compressStoryImage(file: File | Blob): Promise<Blob> {
  return compressImage(file, {
    maxWidth: 1080,
    maxHeight: 1920,
    quality: 0.82,
    maxBytes: 1536 * 1024,
    mimeType: "image/webp",
  });
}
