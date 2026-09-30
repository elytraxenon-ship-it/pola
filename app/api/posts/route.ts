import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createClient, createStaticClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/mock-api-db";
import { CURRENT_USER } from "@/components/feed/dummy-data";
import { Post } from "@/components/feed/types";
import { CACHE_TAGS, CACHE_TTL, revalidateCacheTag } from "@/lib/cache";

// 5-minute cached feed fetcher
const getCachedFeed = unstable_cache(
  async (limitStr: string | null) => {
    const supabase = createStaticClient();
    let query = supabase
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
      .order("created_at", { ascending: false });

    if (limitStr) {
      query = query.limit(parseInt(limitStr, 10));
    }

    const { data: dbPosts, error } = await query;
    if (error || !dbPosts) return null;

    const formatted: Post[] = dbPosts.map((p: any) => {
      const authorProfile = p.profiles || {};
      return {
        id: p.id,
        author: {
          id: String(authorProfile.sequential_id || authorProfile.id || "unknown"),
          name: authorProfile.full_name || authorProfile.username || "بەکارهێنەر",
          handle: `@${authorProfile.username || "user"}`,
          avatar:
            authorProfile.avatar_url ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
          verified: true,
          online: true,
        },
        timestamp: "کەمێک لەمەوبەر",
        privacy: p.privacy || "public",
        content: p.content,
        tags: p.tags || [],
        mediaUrl: p.media_url || undefined,
        likesCount: p.likes_count || 0,
        commentsCount: p.comments_count || 0,
        sharesCount: p.shares_count || 0,
        isLiked: false,
        isSaved: false,
        comments: [],
      };
    });

    return formatted;
  },
  ["feed-posts-cache"],
  { tags: [CACHE_TAGS.feed], revalidate: CACHE_TTL }
);

// GET /api/posts - Fetch posts from Supabase with 5-minute caching, fallback to local mock
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit");

  try {
    const formattedPosts = await getCachedFeed(limit);
    if (formattedPosts) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || formattedPosts.length === 0) return NextResponse.json(formattedPosts);

      const postIds = formattedPosts.map((post) => post.id);
      const [{ data: likes }, { data: reposts }] = await Promise.all([
        supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
        supabase.from("post_reposts").select("post_id").eq("user_id", user.id).in("post_id", postIds),
      ]);
      const likedIds = new Set((likes || []).map((row) => row.post_id));
      const repostedIds = new Set((reposts || []).map((row) => row.post_id));
      return NextResponse.json(formattedPosts.map((post) => ({
        ...post,
        isLiked: likedIds.has(post.id),
        isReposted: repostedIds.has(post.id),
      })), { headers: { "Cache-Control": "private, no-store" } });
    }
  } catch (error) {
    console.error("GET /api/posts Supabase cache error:", error);
  }

  // Fallback to local mockDb
  const posts = mockDb.getPosts();
  if (limit) {
    return NextResponse.json(posts.slice(0, parseInt(limit, 10)));
  }
  return NextResponse.json(posts);
}

// POST /api/posts - Create a new post in Supabase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, mediaUrl, tags, privacy } = body;

    if (!content && !mediaUrl) {
      return NextResponse.json(
        { error: "ناوەرۆک یان وێنەی پۆست پێویستە" },
        { status: 400 }
      );
    }

    // Video check: forbid video files in feed posts
    if (mediaUrl && typeof mediaUrl === "string") {
      const isVideo =
        /\.(mp4|webm|ogg|mov|mkv)(\?.*)?$/i.test(mediaUrl) ||
        mediaUrl.startsWith("data:video/");
      if (isVideo) {
        return NextResponse.json(
          { error: "ڤیدیۆ ڕێگەپێنەدراوە لە پۆستدا، تەنها دەق و وێنە قبوڵ دەکرێت" },
          { status: 400 }
        );
      }
    }

    // Try Supabase insert if user is authenticated
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: inserted, error: insertError } = await supabase
          .from("posts")
          .insert({
            author_id: user.id,
            content: content ? content.trim() : "",
            media_url: mediaUrl || null,
            tags: tags || [],
            privacy: privacy || "public",
          })
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
          .single();

        if (!insertError && inserted) {
          const profile = (inserted as any).profiles || {};
          const newPost: Post = {
            id: inserted.id,
            author: {
              id: String(profile.sequential_id || profile.id || user.id),
              name: profile.full_name || profile.username || "من",
              handle: `@${profile.username || "me"}`,
              avatar:
                profile.avatar_url ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
              verified: true,
              online: true,
            },
            timestamp: "کەمێک لەمەوبەر",
            privacy: inserted.privacy || "public",
            content: inserted.content,
            tags: inserted.tags || [],
            mediaUrl: inserted.media_url || undefined,
            likesCount: 0,
            commentsCount: 0,
            sharesCount: 0,
            isLiked: false,
            isSaved: false,
            comments: [],
          };

          // Invalidate cached feed and author profile
          try {
            revalidateCacheTag(CACHE_TAGS.feed);
            revalidateCacheTag(CACHE_TAGS.profile(user.id));
            if (profile.sequential_id) revalidateCacheTag(CACHE_TAGS.profile(String(profile.sequential_id)));
          } catch (e) {}

          return NextResponse.json(newPost, { status: 201 });
        }
      }
    } catch (dbErr) {
      console.error("Supabase insert error, falling back to mockDb:", dbErr);
    }

    // Fallback in-memory post creation
    const fallbackPost: Post = {
      id: `post-${Date.now()}`,
      author: CURRENT_USER,
      timestamp: "کەمێک لەمەوبەر",
      privacy: privacy || "public",
      content: content ? content.trim() : "",
      tags: tags || [],
      mediaUrl: mediaUrl || undefined,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isLiked: false,
      isSaved: false,
      comments: [],
    };

    mockDb.addPost(fallbackPost);

    try {
      revalidateCacheTag(CACHE_TAGS.feed);
    } catch (e) {}

    return NextResponse.json(fallbackPost, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json(
      { error: error?.message || "هەڵەیەک ڕوویدا لە دروستکردنی پۆستەکە" },
      { status: 500 }
    );
  }
}
