"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/components/feed/types";
import { CURRENT_USER } from "@/components/feed/dummy-data";

// Module-level cache so the fetch happens only once per page load
// regardless of how many components call this hook.
let cachedUser: User | null = null;
let fetchPromise: Promise<User> | null = null;

async function loadCurrentUser(): Promise<User> {
  if (cachedUser) return cachedUser;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return CURRENT_USER;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, sequential_id, full_name, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) return CURRENT_USER;

      const result: User = {
        id: String(profile.sequential_id || profile.id),
        name: profile.full_name || profile.username || user.email?.split("@")[0] || "بەکارهێنەر",
        handle: `@${profile.username || "user"}`,
        avatar:
          profile.avatar_url ||
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          CURRENT_USER.avatar,
        verified: true,
        online: true,
      };

      cachedUser = result;
      return result;
    } catch {
      return CURRENT_USER;
    }
  })();

  return fetchPromise;
}

/** Call this to bust the cache (e.g. after avatar upload). */
export function invalidateCurrentUserCache() {
  cachedUser = null;
  fetchPromise = null;
}

export function useCurrentUser(): User {
  const [user, setUser] = useState<User>(cachedUser ?? CURRENT_USER);

  useEffect(() => {
    loadCurrentUser().then(setUser);
  }, []);

  return user;
}
