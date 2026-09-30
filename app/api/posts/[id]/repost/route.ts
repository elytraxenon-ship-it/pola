import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/mock-api-db";
import { CACHE_TAGS, revalidateCacheTag } from "@/lib/cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Reposts are stored per user; a composite primary key makes retries idempotent.
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action === "undo" ? "undo" : "repost";
  let authenticatedUserId: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      authenticatedUserId = user.id;
      const { data: post, error: postError } = await supabase
        .from("posts")
        .select("id, shares_count")
        .eq("id", id)
        .maybeSingle();
      if (postError) throw postError;
      if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

      if (action === "undo") {
        const { error } = await supabase.from("post_reposts").delete()
          .eq("post_id", id).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("post_reposts").upsert(
          { post_id: id, user_id: user.id },
          { onConflict: "user_id,post_id", ignoreDuplicates: true }
        );
        if (error) throw error;
      }

      const { data: refreshed } = await supabase.from("posts")
        .select("shares_count").eq("id", id).maybeSingle();

      try { revalidateCacheTag(CACHE_TAGS.feed); } catch {}
      return NextResponse.json({ success: true, sharesCount: refreshed?.shares_count ?? post.shares_count ?? 0, action });
    }
  } catch (err) {
    console.error("POST /api/posts/[id]/repost Supabase error:", err);
  }

  if (authenticatedUserId) {
    return NextResponse.json({ error: "Repost update failed. Please try again." }, { status: 500 });
  }

  const post = mockDb.getPostById(id);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  post.sharesCount = action === "undo"
    ? Math.max(0, (post.sharesCount || 0) - 1)
    : (post.sharesCount || 0) + 1;
  return NextResponse.json({ success: true, sharesCount: post.sharesCount, action });
}
