import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/mock-api-db";
import { CACHE_TAGS, revalidateCacheTag } from "@/lib/cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const requestedState = typeof body.isLiked === "boolean" ? body.isLiked : null;
  let authenticatedUserId: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      authenticatedUserId = user.id;
      const { data: existingLike, error: lookupError } = await supabase
        .from("post_likes")
        .select("user_id")
        .eq("post_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (lookupError) throw lookupError;

      const isLiked = requestedState ?? !existingLike;

      if (isLiked && !existingLike) {
        const { error } = await supabase.from("post_likes").upsert(
          { post_id: id, user_id: user.id },
          { onConflict: "user_id,post_id", ignoreDuplicates: true }
        );
        if (error) throw error;
      } else if (!isLiked && existingLike) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", id)
          .eq("user_id", user.id);
        if (error) throw error;
      }

      // Fetch fresh likes count
      const { data: postData } = await supabase
        .from("posts")
        .select("likes_count, author_id, profiles:author_id(sequential_id)")
        .eq("id", id)
        .maybeSingle();

      try {
        revalidateCacheTag(CACHE_TAGS.feed);
        if (postData?.author_id) {
          revalidateCacheTag(CACHE_TAGS.profile(postData.author_id));
          const profile = Array.isArray(postData.profiles) ? postData.profiles[0] : postData.profiles;
          if (profile?.sequential_id) revalidateCacheTag(CACHE_TAGS.profile(String(profile.sequential_id)));
        }
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

  if (authenticatedUserId) {
    return NextResponse.json({ error: "Like update failed. Please try again." }, { status: 500 });
  }

  // Fallback to mockDb for local/demo posts only.
  const post = mockDb.getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const wasLiked = Boolean(post.isLiked);
  const nextIsLiked = requestedState ?? !wasLiked;
  const nextLikesCount = Math.max(
    0,
    (post.likesCount || 0) + (nextIsLiked === wasLiked ? 0 : nextIsLiked ? 1 : -1)
  );

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
