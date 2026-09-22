import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

// ── R2 Client ──────────────────────────────────────────────────────────────────
// Cloudflare R2 is S3-compatible; endpoint points to R2 S3 storage API.

export function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID || process.env.Account_Id;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.Access_Key_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.Secret_Access_key;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env"
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Upload a buffer/blob to a specific R2 bucket.
 * Returns the public URL (uses R2_PUBLIC_URL if set, or local /api/media proxy fallback).
 */
export async function uploadToR2(
  bucket: string,
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const publicBase = process.env.R2_PUBLIC_URL?.trim();
  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/${bucket}/${key}`;
  }

  // Fallback to Pola media proxy route
  return `/api/media/${bucket}/${key}`;
}

/**
 * Delete an object from R2.
 * Safe to call even if the key doesn't exist (R2 returns 204 either way).
 */
export async function deleteFromR2(bucket: string, key: string): Promise<void> {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

/**
 * Fetch an object stream directly from R2 (used by the /api/media streaming route).
 */
export async function getObjectFromR2(bucket: string, key: string) {
  const client = getR2Client();
  return client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

/**
 * Extract the bucket + key from a Pola R2 URL or media proxy URL.
 * Expected formats:
 * - /api/media/{bucket}/{key}
 * - {R2_PUBLIC_URL}/{bucket}/{key}
 * - https://.../{bucket}/{key} where bucket is 'avatar' | 'banner' | 'post'
 * Returns null if the URL is not an R2 URL (e.g. Google avatar URL).
 */
export function extractR2BucketAndKey(url: string | null | undefined): { bucket: string; key: string } | null {
  if (!url) return null;

  // 1. Check local media proxy
  if (url.startsWith("/api/media/")) {
    const parts = url.slice("/api/media/".length).split("/");
    const bucket = parts[0];
    const key = parts.slice(1).join("/");
    if (bucket && key) return { bucket, key };
  }

  // 2. Check public base URL
  const publicBase = process.env.R2_PUBLIC_URL?.trim();
  if (publicBase && url.startsWith(publicBase)) {
    const withoutBase = url.slice(publicBase.replace(/\/$/, "").length + 1);
    const slashIdx = withoutBase.indexOf("/");
    if (slashIdx !== -1) {
      const bucket = withoutBase.slice(0, slashIdx);
      const key = withoutBase.slice(slashIdx + 1);
      if (bucket && key) return { bucket, key };
    }
  }

  // 3. Check for known bucket paths in full URL
  const validBuckets = ["avatar", "banner", "post"];
  try {
    const parsed = new URL(url, "http://localhost");
    const segments = parsed.pathname.split("/").filter(Boolean);
    // Look for valid bucket in path
    for (let i = 0; i < segments.length - 1; i++) {
      if (validBuckets.includes(segments[i])) {
        const bucket = segments[i];
        const key = segments.slice(i + 1).join("/");
        if (bucket && key) return { bucket, key };
      }
    }
  } catch {
    // ignore URL parse errors
  }

  return null;
}
