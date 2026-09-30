import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/mock-api-db";
import { deleteFromR2, extractR2BucketAndKey } from "@/lib/r2";
import { CACHE_TAGS, revalidateCacheTag } from "@/lib/cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/posts/[id] - Fetch single post
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: post, error } = await supabase
      .from("posts")
      .select(`
        id,
        content,
        media_url,
        privacy,
        tags,
        likes_count,
        comments_count,
        shares_count,
        created_at,
        profiles:author_id (
          id,
          sequential_id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (post && !error) {
      const author = (post as any).profiles || {};
      const { data: { user } } = await supabase.auth.getUser();
      let isLiked = false;
      let isReposted = false;
      if (user) {
        const [{ data: like }, { data: repost }] = await Promise.all([
          supabase.from("post_likes").select("user_id").eq("post_id", id).eq("user_id", user.id).maybeSingle(),
          supabase.from("post_reposts").select("user_id").eq("post_id", id).eq("user_id", user.id).maybeSingle(),
        ]);
        isLiked = Boolean(like);
        isReposted = Boolean(repost);
      }
      return NextResponse.json({
        id: post.id,
        author: {
          id: String(author.sequential_id || author.id || "unknown"),
          name: author.full_name || author.username || "بەکارهێنەر",
          handle: `@${author.username || "user"}`,
          avatar:
            author.avatar_url ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
          verified: true,
          online: true,
        },
        timestamp: "کەمێک لەمەوبەر",
        privacy: post.privacy || "public",
        content: post.content,
        tags: post.tags || [],
        mediaUrl: post.media_url || undefined,
        likesCount: post.likes_count || 0,
        commentsCount: post.comments_count || 0,
        sharesCount: post.shares_count || 0,
        isLiked,
        isReposted,
        isSaved: false,
        comments: [],
      }, { headers: { "Cache-Control": "private, no-store" } });
    }
  } catch (err) {
    console.error("GET /api/posts/[id] Supabase error:", err);
  }

  // Fallback to mockDb
  const post = mockDb.getPostById(id);
  if (!post) {
    return NextResponse.json(
      { error: "پۆستەکە نەدۆزرایەوە" },
      { status: 404 }
    );
  }

  return NextResponse.json(post);
}

// PATCH /api/posts/[id] - Edit post content in Supabase
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "دەقی پۆستەکە ناتوانرێت بەتاڵ بێت" },
        { status: 400 }
      );
    }

    try {
      const supabase = await createClient();
      const { data: updated, error } = await supabase
        .from("posts")
        .update({ content: content.trim() })
        .eq("id", id)
        .select()
        .single();

      if (updated && !error) {
        mockDb.updatePost(id, { content: content.trim() });
        try {
          revalidateCacheTag(CACHE_TAGS.feed);
        } catch (e) {}
        return NextResponse.json(updated);
      }
    } catch (err) {
      console.error("PATCH /api/posts/[id] Supabase error:", err);
    }

    // Fallback to mockDb
    const updatedMock = mockDb.updatePost(id, { content: content.trim() });
    if (!updatedMock) {
      return NextResponse.json(
        { error: "پۆستەکە نەدۆزرایەوە بۆ دەستکاریکردن" },
        { status: 404 }
      );
    }

    try {
      revalidateCacheTag(CACHE_TAGS.feed);
    } catch (e) {}

    return NextResponse.json(updatedMock);
  } catch (error) {
    return NextResponse.json(
      { error: "هەڵەیەک ڕوویدا لە کاتی نوێکردنەوەی پۆستدا" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete post in Supabase and clean up R2 media
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const supabase = await createClient();

    // 1. Fetch post info to check for media in R2
    const { data: postToDelete } = await supabase
      .from("posts")
      .select("media_url, author_id, profiles:author_id(sequential_id)")
      .eq("id", id)
      .maybeSingle();

    // 2. Delete media from R2 if present
    if (postToDelete?.media_url) {
      const r2 = extractR2BucketAndKey(postToDelete.media_url);
      if (r2) {
        try {
          await deleteFromR2(r2.bucket, r2.key);
        } catch (r2Err) {
          console.warn("[R2] Failed to delete media on post delete:", r2Err);
        }
      }
    }

    // 3. Delete post row from Supabase
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (!error) {
      mockDb.deletePost(id);

      // 4. Invalidate feed and author profile cache
      try {
        revalidateCacheTag(CACHE_TAGS.feed);
        if (postToDelete?.author_id) {
          revalidateCacheTag(CACHE_TAGS.profile(postToDelete.author_id));
          const profile = postToDelete.profiles as { sequential_id?: number | string } | null;
          if (profile?.sequential_id) revalidateCacheTag(CACHE_TAGS.profile(String(profile.sequential_id)));
        }
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: "پۆستەکە بە سەرکەوتوویی سڕدرایەوە",
      });
    }
  } catch (err) {
    console.error("DELETE /api/posts/[id] Supabase error:", err);
  }

  // Fallback to mockDb
  const success = mockDb.deletePost(id);
  if (!success) {
    return NextResponse.json(
      { error: "پۆستەکە نەدۆزرایەوە بۆ سڕینەوە" },
      { status: 404 }
    );
  }

  try {
    revalidateCacheTag(CACHE_TAGS.feed);
  } catch (e) {}

  return NextResponse.json({
    success: true,
    message: "پۆستەکە بە سەرکەوتوویی سڕدرایەوە",
  });
}
