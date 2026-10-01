import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
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

    if (typeof content !== "string" || !content.trim() || content.trim().length > 10000) {
      return NextResponse.json(
        { error: "دەقی پۆست پێویستە و نابێت لە ١٠٠٠٠ پیت زیاتر بێت" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "تکایە سەرەتا بچۆ ژوورەوە" }, { status: 401 });

    const admin = createAdminClient();
    const { data: existing, error: lookupError } = await admin
      .from("posts").select("author_id").eq("id", id).maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) return NextResponse.json({ error: "پۆستەکە نەدۆزرایەوە" }, { status: 404 });
    if (existing.author_id !== user.id) return NextResponse.json({ error: "تەنها خاوەنی پۆست دەتوانێت دەستکاری بکات" }, { status: 403 });

    const { data: updated, error } = await admin
      .from("posts")
      .update({ content: content.trim() })
      .eq("id", id)
      .eq("author_id", user.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!updated) return NextResponse.json({ error: "پۆستەکە نەدۆزرایەوە" }, { status: 404 });

    revalidateCacheTag(CACHE_TAGS.feed);
    revalidateCacheTag(CACHE_TAGS.profile(user.id));
    return NextResponse.json(updated, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("PATCH /api/posts/[id] error:", error);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "تکایە سەرەتا بچۆ ژوورەوە" }, { status: 401 });

    const admin = createAdminClient();
    const { data: existing, error: lookupError } = await admin
      .from("posts")
      .select("author_id,media_url")
      .eq("id", id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) return NextResponse.json({ error: "پۆستەکە نەدۆزرایەوە" }, { status: 404 });
    if (existing.author_id !== user.id) return NextResponse.json({ error: "تەنها خاوەنی پۆست دەتوانێت بیسڕێتەوە" }, { status: 403 });

    // Delete the authorized database row first; storage cleanup must never run
    // for an unauthorized request or remove media while leaving the post live.
    const { data: deleted, error } = await admin.from("posts")
      .delete()
      .eq("id", id)
      .eq("author_id", user.id)
      .select("id,media_url")
      .maybeSingle();
    if (error) throw error;
    if (!deleted) return NextResponse.json({ error: "پۆستەکە نەدۆزرایەوە" }, { status: 404 });

    if (deleted.media_url) {
      const r2 = extractR2BucketAndKey(deleted.media_url);
      if (r2) {
        try { await deleteFromR2(r2.bucket, r2.key); }
        catch (storageError) { console.error("Post media cleanup failed:", storageError); }
      }
    }

    revalidateCacheTag(CACHE_TAGS.feed);
    revalidateCacheTag(CACHE_TAGS.profile(user.id));
    mockDb.deletePost(id);
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("DELETE /api/posts/[id] Supabase error:", err);
  }
  return NextResponse.json({ error: "نەتوانرا پۆستەکە بسڕدرێتەوە" }, { status: 500 });
}
