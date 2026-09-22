import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── Per-user in-memory cache to stop spam ─────────────────────────────────────
// Maps userId → { data, expiresAt }
const NOTIF_CACHE = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 15_000; // 15 seconds

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    // ── Return cached result if still fresh ──────────────────────────────────
    const now = Date.now();
    const cached = NOTIF_CACHE.get(user.id);
    if (cached && cached.expiresAt > now) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "private, max-age=15",
          "X-Cache": "HIT",
        },
      });
    }

    const { data: dbNotifs, error } = await supabase
      .from("notifications")
      .select(`
        id,
        type,
        entity_type,
        entity_id,
        content,
        read,
        created_at,
        actor:actor_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) {
      console.error("[GET /api/notifications Error]:", error);
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const notifications = (dbNotifs || []).map((n: any) => {
      const actorProfile = n.actor || {};
      const actorName = actorProfile.full_name || actorProfile.username || "بەکارهێنەر";
      const actorHandle = `@${actorProfile.username || "user"}`;
      const actorAvatar =
        actorProfile.avatar_url ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

      // Time formatting in Kurdish
      const date = new Date(n.created_at);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeKu = "کەمێک لەمەوبەر";
      let timeEn = "Just now";
      if (diffMins > 0 && diffMins < 60) {
        timeKu = `${diffMins} خولەک`;
        timeEn = `${diffMins}m`;
      } else if (diffHours >= 1 && diffHours < 24) {
        timeKu = `${diffHours} کاتژمێر`;
        timeEn = `${diffHours}h`;
      } else if (diffDays >= 1) {
        timeKu = `${diffDays} ڕۆژ`;
        timeEn = `${diffDays}d`;
      }

      return {
        id: n.id,
        type: n.type || "flame",
        actor: {
          name: actorName,
          handle: actorHandle,
          avatar: actorAvatar,
        },
        text: n.content || "چالاکییەکی نوێ لەسەر پڕۆفایلەکەت تۆمارکرا",
        textEn:
          n.type === "flame"
            ? "liked your moment with a flame boost"
            : n.type === "comment"
            ? "commented on your moment"
            : "interacted with you",
        time: timeKu,
        timeEn: timeEn,
        read: !!n.read,
      };
    });

    const unreadCount = notifications.filter((n) => !n.read).length;
    const responseData = { notifications, unreadCount };

    // ── Store in memory cache ─────────────────────────────────────────────────
    NOTIF_CACHE.set(user.id, { data: responseData, expiresAt: now + CACHE_TTL_MS });

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "private, max-age=15",
        "X-Cache": "MISS",
      },
    });
  } catch (error: any) {
    console.error("[GET /api/notifications Exception]:", error);
    return NextResponse.json(
      { notifications: [], unreadCount: 0, error: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "تکایە سەرەتا بچۆ ژوورەوە" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, all } = body;

    let query = supabase.from("notifications").update({ read: true });

    if (all) {
      query = query.eq("recipient_id", user.id).eq("read", false);
    } else if (id) {
      query = query.eq("id", id).eq("recipient_id", user.id);
    } else {
      return NextResponse.json({ error: "پێناسی ئاگاداری دیاری نەکراوە" }, { status: 400 });
    }

    const { error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Bust the in-memory cache so next read reflects the new read state
    NOTIF_CACHE.delete(user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "هەڵەیەک ڕوویدا" },
      { status: 500 }
    );
  }
}
