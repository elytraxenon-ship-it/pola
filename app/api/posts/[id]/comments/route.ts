import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/mock-api-db";
import { Comment } from "@/components/feed/types";
import { CACHE_TAGS, revalidateCacheTag } from "@/lib/cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/posts/[id]/comments
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: comments, error } = await supabase
      .from("post_comments")
      .select(`
        id,
        content,
        created_at,
        profiles:author_id (
          id,
          sequential_id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq("post_id", id)
      .order("created_at", { ascending: true });

    if (comments && !error) {
      const formatted: Comment[] = comments.map((c: any) => {
        const author = c.profiles || {};
        return {
          id: c.id,
          author: {
            id: String(author.sequential_id || author.id || "user"),
            name: author.full_name || author.username || "بەکارهێنەر",
            handle: `@${author.username || "user"}`,
            avatar:
              author.avatar_url ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
            verified: true,
          },
          content: c.content,
          timestamp: "کەمێک لەمەوبەر",
          likes: 0,
        };
      });
      return NextResponse.json(formatted);
    }
  } catch (err) {
    console.error("GET /api/posts/[id]/comments error:", err);
  }

  // Fallback to mockDb
  const post = mockDb.getPostById(id);
  return NextResponse.json(post?.comments || []);
}

// POST /api/posts/[id]/comments
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "لێدوان ناتوانرێت بەتاڵ بێت" },
        { status: 400 }
      );
    }

    const trimmed = content.trim();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: comment, error } = await supabase
        .from("post_comments")
        .insert({
          post_id: id,
          author_id: user.id,
          content: trimmed,
        })
        .select(`
          id,
          content,
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

      if (comment && !error) {
        const author = (comment as any).profiles || {};
        const formatted: Comment = {
          id: comment.id,
          author: {
            id: String(author.sequential_id || author.id || user.id),
            name: author.full_name || author.username || "من",
            handle: `@${author.username || "me"}`,
            avatar:
              author.avatar_url ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
            verified: true,
          },
          content: comment.content,
          timestamp: "کەمێک لەمەوبەر",
          likes: 0,
        };

        // Notify post author if different
        const { data: post } = await supabase
          .from("posts")
          .select("author_id, comments_count")
          .eq("id", id)
          .maybeSingle();

        if (post && post.author_id !== user.id) {
          await supabase.from("notifications").insert({
            recipient_id: post.author_id,
            actor_id: user.id,
            type: "comment",
            entity_type: "post",
            entity_id: id,
            content: `لێدوانی نووسی: "${trimmed.slice(0, 40)}"`,
          });
        }

        try {
          revalidateCacheTag(CACHE_TAGS.feed);
        } catch {}

        return NextResponse.json({
          comment: formatted,
          commentsCount: post?.comments_count ?? 1,
        });
      }
    }
  } catch (err) {
    console.error("POST /api/posts/[id]/comments error:", err);
  }

  // Fallback to mockDb
  const body = await request.clone().json().catch(() => ({}));
  const trimmed = body.content?.trim() || "";
  const mockComment: Comment = {
    id: `c-${Date.now()}`,
    author: {
      id: "u-current",
      name: "من",
      handle: "@me",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    content: trimmed,
    timestamp: "کەمێک لەمەوبەر",
    likes: 0,
  };

  const post = mockDb.getPostById(id);
  if (post) {
    post.comments = [...(post.comments || []), mockComment];
    post.commentsCount = (post.commentsCount || 0) + 1;
  }

  return NextResponse.json({
    comment: mockComment,
    commentsCount: post?.commentsCount ?? 1,
  });
}
