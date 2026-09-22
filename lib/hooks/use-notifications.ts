"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { NotificationItem } from "@/components/feed/notifications-popover";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  // Minimum gap between API fetches (10 s) to prevent spam when multiple
  // components call refreshNotifications at the same time.
  const lastFetchAt = useRef(0);
  const fetchInFlight = useRef(false);

  // One stable Supabase client per hook instance
  const supabaseRef = useRef(createClient());
  // Unique suffix per hook instance so two instances never collide on channel name
  const instanceId = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);

  // ── 1. Fetch notifications from API ────────────────────────────────────────
  const refreshNotifications = useCallback(async (force = false) => {
    const now = Date.now();
    // Throttle: skip if a fetch ran within the last 10 seconds (unless forced)
    if (!force && (fetchInFlight.current || now - lastFetchAt.current < 10_000)) return;

    fetchInFlight.current = true;
    lastFetchAt.current = now;
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      // Only use real data — never fall back to mock samples
      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount ?? 0);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.warn("[useNotifications] fetch error:", err);
      // On network error keep existing state (don't inject fake data)
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
      fetchInFlight.current = false;
    }
  }, []);

  // ── 2. Auth listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = supabaseRef.current;
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
      refreshNotifications();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshNotifications]);

  // ── 3. Realtime subscription ────────────────────────────────────────────────
  // Key fix: always removeChannel before creating a new one so we never call
  // .on() on an already-subscribed channel (which throws in React StrictMode
  // and when multiple hook instances share the same channel name).
  useEffect(() => {
    refreshNotifications();

    if (!userId) return;

    const supabase = supabaseRef.current;
    // Unique channel name per (userId + hook instance) to avoid cross-instance collisions
    const channelName = `notif-${userId}-${instanceId.current}`;

    // Remove any stale channel with this name before subscribing
    const existing = supabase.getChannels().find((c) => c.topic === `realtime:${channelName}`);
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        async (_payload: any) => {
          // Real-time INSERT: bypass the throttle since this is genuine new data
          await refreshNotifications(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refreshNotifications]);

  // ── 4. Mark single notification as read ────────────────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error("[useNotifications] markAsRead error:", err);
    }
  }, []);

  // ── 5. Mark all as read ─────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch (err) {
      console.error("[useNotifications] markAllAsRead error:", err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };
}
