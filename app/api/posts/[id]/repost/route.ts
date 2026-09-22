import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/mock-api-db";
import { CACHE_TAGS, revalidateCacheTag } from "@/lib/cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/posts/[id]/repost - Toggle/increment/decrement repost
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let action = "repost";
  let caption = "";

  try {
    const body = await request.json();
    if (body.action) action = body.action;
    if (body.caption) caption = body.caption;
  } catch {}

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch current shares_count
    const { data: post } = await supabase
      .from("posts")
      .select("id, author_id, shares_count")
      .eq("id", id)
      .maybeSingle();

    if (post) {
      const currentShares = post.shares_count || 0;
      const nextShares =
        action === "undo" ? Math.max(0, currentShares - 1) : currentShares + 1;

      await supabase
        .from("posts")
        .update({ shares_count: nextShares })
        .eq("id", id);

      if (action !== "undo" && user && post.author_id !== user.id) {
        await supabase.from("notifications").insert({
          recipient_id: post.author_id,
          actor_id: user.id,
          type: "spark",
          entity_type: "post",
          entity_id: id,
          content: caption
            ? `پۆستەکەت دووبارە بڵاوکرایەوە: "${caption.slice(0, 30)}"`
            : "پۆستەکەتی دووبارە بڵاوکردەوە 🔁",
        });
      }

      try {
        revalidateCacheTag(CACHE_TAGS.feed);
      } catch {}

      return NextResponse.json({
        success: true,
        sharesCount: nextShares,
        action,
      });
    }
  } catch (err) {
    console.error("POST /api/posts/[id]/repost Supabase error:", err);
  }

  // Fallback to mockDb
  const post = mockDb.getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (action === "undo") {
    post.sharesCount = Math.max(0, (post.sharesCount || 1) - 1);
  } else {
    post.sharesCount = (post.sharesCount || 0) + 1;
  }

  return NextResponse.json({
    success: true,
    sharesCount: post.sharesCount,
    action,
  });
}
