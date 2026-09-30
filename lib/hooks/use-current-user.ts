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

  const pending = (async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return CURRENT_USER;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, sequential_id, full_name, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        const result: User = {
          id: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "بەکارهێنەر",
          handle: `@${user.user_metadata?.user_name || user.user_metadata?.preferred_username || "user"}`,
          avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
          verified: false,
          online: true,
        };
        cachedUser = result;
        return result;
      }

      const result: User = {
        id: String(profile.sequential_id || profile.id),
        name: profile.full_name || profile.username || user.email?.split("@")[0] || "بەکارهێنەر",
        handle: `@${profile.username || "user"}`,
        avatar:
          profile.avatar_url ||
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          "",
        verified: true,
        online: true,
      };

      cachedUser = result;
      return result;
    } catch {
      return {
        id: "unknown",
        name: "بەکارهێنەر",
        handle: "@user",
        avatar: "",
        verified: false,
        online: false,
      };
    }
  })();
  fetchPromise = pending;

  const loadedUser = await pending;
  // Anonymous/failure fallbacks are intentionally not cached so a sign-in on
  // the same tab can load the newly authenticated profile on the next visit.
  if (!cachedUser && fetchPromise === pending) fetchPromise = null;
  return loadedUser;
}

/** Call this to bust the cache (e.g. after avatar upload). */
export function invalidateCurrentUserCache() {
  cachedUser = null;
  fetchPromise = null;
}

export function useCurrentUserState(): { user: User; isLoading: boolean } {
  const [user, setUser] = useState<User>(cachedUser ?? CURRENT_USER);
  const [isLoading, setIsLoading] = useState(!cachedUser);

  useEffect(() => {
    let active = true;
    loadCurrentUser().then((loadedUser) => {
      if (!active) return;
      setUser(loadedUser);
      setIsLoading(false);
    });
    return () => { active = false; };
  }, []);

  return { user, isLoading };
}

export function useCurrentUser(): User {
  return useCurrentUserState().user;
}
