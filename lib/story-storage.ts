import { createHmac } from "crypto";

/** Keep story object names unguessable even when a public profile reveals its UUID. */
export function getStoryObjectKey(userId: string, storyId: string): string {
  const secret = process.env.R2_STORY_KEY_SECRET || process.env.SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Missing R2_STORY_KEY_SECRET or SERVICE_ROLE_KEY");
  const objectToken = createHmac("sha256", secret).update(`${userId}:${storyId}`).digest("hex");
  return `stories/${userId}/${objectToken}.webp`;
}
