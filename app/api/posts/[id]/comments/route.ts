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
  const search = new URL(request.url).searchParams;
  const requestedLimit = Number(search.get("limit") || 30);
  const limit = Number.isFinite(requestedLimit) ? Math.min(50, Math.max(1, requestedLimit)) : 30;
  const before = search.get("before");

  try {
    const supabase = await createClient();
    let query = supabase
      .from("post_comments")
      .select(`
        id,
        content,
        parent_comment_id,
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
      .order("created_at", { ascending: false });

    if (before) query = query.lt("created_at", before);
    const { data: comments, error } = await query.limit(limit);

    if (comments && !error) {
      const formatted: Comment[] = comments.map((c: any) => {
        const author = c.profiles || {};
        const createdAt = new Date(c.created_at);
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
          parentId: c.parent_comment_id || undefined,
          timestamp: createdAt.toLocaleString("ckb", { dateStyle: "medium", timeStyle: "short" }),
          timestampEn: createdAt.toLocaleString("en", { dateStyle: "medium", timeStyle: "short" }),
          createdAt: c.created_at,
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
  let authenticatedUserId: string | null = null;

  try {
    const body = await request.json();
    const { content } = body;
    const requestedParentId = body.parentId;

    if (!content || typeof content !== "string" || !content.trim() || content.trim().length > 2000) {
      return NextResponse.json(
        { error: "لێدوان پێویستە و نابێت لە ٢٠٠٠ پیت زیاتر بێت" },
        { status: 400 }
      );
    }
    if (requestedParentId !== undefined && (typeof requestedParentId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestedParentId))) {
      return NextResponse.json({ error: "لێدوانی وەڵام نادروستە" }, { status: 400 });
    }

    const trimmed = content.trim();
    let parentCommentId: string | null = requestedParentId || null;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      authenticatedUserId = user.id;
      if (parentCommentId) {
        const { data: parent, error: parentError } = await supabase
          .from("post_comments")
          .select("id,post_id,parent_comment_id")
          .eq("id", parentCommentId)
          .maybeSingle();
        if (parentError) throw parentError;
        if (!parent || parent.post_id !== id) {
          return NextResponse.json({ error: "لێدوانی وەڵام نادۆزرێتەوە" }, { status: 404 });
        }
        // Keep a single, readable thread level. Replies to replies stay in the
        // original comment thread rather than nesting indefinitely.
        parentCommentId = parent.parent_comment_id || parent.id;
      }
      const { data: comment, error } = await supabase
        .from("post_comments")
        .insert({
          post_id: id,
          author_id: user.id,
          content: trimmed,
          parent_comment_id: parentCommentId,
        })
        .select(`
          id,
          content,
          parent_comment_id,
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
        const createdAt = new Date(comment.created_at);
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
          parentId: comment.parent_comment_id || undefined,
          timestamp: createdAt.toLocaleString("ckb", { dateStyle: "medium", timeStyle: "short" }),
          timestampEn: createdAt.toLocaleString("en", { dateStyle: "medium", timeStyle: "short" }),
          createdAt: comment.created_at,
          likes: 0,
        };

        const { data: post } = await supabase
          .from("posts")
          .select("author_id, comments_count")
          .eq("id", id)
          .maybeSingle();

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

  if (authenticatedUserId) {
    return NextResponse.json({ error: "Comment could not be saved. Please try again." }, { status: 500 });
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
    parentId: typeof body.parentId === "string" ? body.parentId : undefined,
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
