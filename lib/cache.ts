import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  profile: (id: string) => `profile-${id}`,
  feed: "posts-feed",
} as const;

export const CACHE_TTL = 300; // 5 minutes in seconds

/**
 * Revalidate a cache tag safely across Next.js versions.
 * In Next.js 15+/canary, revalidateTag accepts a second profile argument ('max' or { expire: 0 }).
 */
export function revalidateCacheTag(tag: string) {
  try {
    (revalidateTag as any)(tag, "max");
  } catch (err) {
    console.warn("[Cache] revalidateTag warning:", err);
  }
}
