import { NextRequest, NextResponse } from "next/server";
import { createStaticClient } from "@/lib/supabase/server";

interface RouteParams { params: Promise<{ id: string }> }

// Cursor-paginated public media; each request is bounded and uses the existing
// author/date indexes so opening a profile never downloads a creator's full history.
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const uuidPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Invalid profile id" }, { status: 400 });
  }

  const search = new URL(request.url).searchParams;
  const limitValue = Number(search.get("limit") || 24);
  const limit = Number.isFinite(limitValue) ? Math.min(48, Math.max(1, limitValue)) : 24;
  const cursorDate = search.get("beforeDate");
  const cursorId = search.get("beforeId");

  try {
    const supabase = createStaticClient();
    let query = supabase.from("posts")
      .select("id, media_url, created_at")
      .eq("author_id", id)
      .eq("privacy", "public")
      .not("media_url", "is", null)
      .not("media_url", "imatch", "[.](mp4|webm|ogg|mov|mkv)([?].*)?$")
      .not("media_url", "ilike", "data:video/%")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);

    if (cursorDate && cursorId && /^\d{4}-\d\d-\d\dT/.test(cursorDate) && uuidPattern.test(cursorId)) {
      query = query.or(`created_at.lt.${cursorDate},and(created_at.eq.${cursorDate},id.lt.${cursorId})`);
    }

    const { data, error } = await query;
    if (error) throw error;
    const rows = data || [];
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    return NextResponse.json({
      media: page.map((row) => ({ id: row.id, url: row.media_url, created_at: row.created_at })),
      hasMore,
    }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("GET /api/users/[id]/media error:", error);
    return NextResponse.json({ error: "Unable to load profile media" }, { status: 500 });
  }
}
