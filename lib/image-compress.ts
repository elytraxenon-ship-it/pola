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
  const canvas = new OffscreenCanvas(outW, outH);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, outW, outH);
  bitmap.close();

  // ── Encode with decreasing quality until under maxBytes ───────────────────
  let quality = initialQuality;
  let blob: Blob;

  do {
    blob = await canvas.convertToBlob({ type: mimeType, quality });
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
