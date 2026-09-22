import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/mock-api-db";
import { CACHE_TAGS, revalidateCacheTag } from "@/lib/cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Check if user already liked
      const { data: existingLike } = await supabase
        .from("post_likes")
        .select("user_id")
        .eq("post_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      let isLiked = false;

      if (existingLike) {
        // Unlike
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", id)
          .eq("user_id", user.id);
        isLiked = false;
      } else {
        // Like
        await supabase.from("post_likes").insert({
          post_id: id,
          user_id: user.id,
        });
        isLiked = true;

        // Notify post author if different user
        const { data: post } = await supabase
          .from("posts")
          .select("author_id")
          .eq("id", id)
          .maybeSingle();

        if (post && post.author_id !== user.id) {
          await supabase.from("notifications").insert({
            recipient_id: post.author_id,
            actor_id: user.id,
            type: "flame",
            entity_type: "post",
            entity_id: id,
            content: "دەنگدانەوەی بە پۆستەکەت بەخشی 🔥",
          });
        }
      }

      // Fetch fresh likes count
      const { data: postData } = await supabase
        .from("posts")
        .select("likes_count")
        .eq("id", id)
        .maybeSingle();

      try {
        revalidateCacheTag(CACHE_TAGS.feed);
      } catch {}

      return NextResponse.json({
        success: true,
        isLiked,
        likesCount: postData?.likes_count ?? 0,
      });
    }
  } catch (err) {
    console.error("POST /api/posts/[id]/like Supabase error:", err);
  }

  // Fallback to mockDb
  const post = mockDb.getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const nextIsLiked = !post.isLiked;
  const nextLikesCount = nextIsLiked
    ? (post.likesCount || 0) + 1
    : Math.max(0, (post.likesCount || 1) - 1);

  mockDb.updatePost(id, {
    isLiked: nextIsLiked,
    likesCount: nextLikesCount,
  });

  return NextResponse.json({
    success: true,
    isLiked: nextIsLiked,
    likesCount: nextLikesCount,
  });
}
