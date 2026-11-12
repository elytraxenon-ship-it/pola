import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { findPostTopics } from "@/lib/post-topics";

const MAX_QUERY_LENGTH = 80;
const MIN_QUERY_LENGTH = 3;
const RESULT_LIMIT = 8;

interface SearchProfileRow {
  id: string;
  sequential_id: number | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  followers_count: number | null;
}

interface SearchPostAuthorRow {
  id: string;
  sequential_id: number | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface SearchPostRow {
  id: string;
  content: string | null;
  media_url: string | null;
  created_at: string;
  profiles: SearchPostAuthorRow | SearchPostAuthorRow[] | null;
}

function getClientIp(request: NextRequest) {
  // Prefer single-value headers written by the trusted edge proxy. The raw IP
  // is never stored or sent to Supabase.
  const cloudflare = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflare) return cloudflare;
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  // Hosting platforms set this header at the edge. Only the first forwarded
  // address is used; the raw value is never stored or sent to Supabase.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

function rateLimitIdentity(subject: string) {
  const secret = process.env.SEARCH_RATE_LIMIT_SECRET || process.env.SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Search rate limit secret is not configured");
  return createHmac("sha256", secret).update(subject).digest("hex");
}

function responseHeaders(limit: number, remaining: number, dailyLimit: number, dailyRemaining: number) {
  return {
    "Cache-Control": "private, no-store",
    "RateLimit-Policy": `${limit};w=60, ${dailyLimit};w=86400`,
    "RateLimit-Limit": `${limit};w=60, ${dailyLimit};w=86400`,
    "RateLimit-Remaining": String(Math.max(0, remaining)),
    "X-RateLimit-Day-Limit": String(dailyLimit),
    "X-RateLimit-Day-Remaining": String(Math.max(0, dailyRemaining)),
    "X-Content-Type-Options": "nosniff",
  };
}

export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get("q") || "";
  const query = rawQuery
    .normalize("NFKC")
    .replace(/^\s*@/, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[%_*(),"\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_LENGTH);

  if (Array.from(query).length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ users: [], posts: [] }, { headers: { "Cache-Control": "private, no-store" } });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const identity = user ? `user:${user.id}` : `ip:${getClientIp(request)}`;
    const admin = createAdminClient();
    const { data: limitData, error: limitError } = await admin.rpc("consume_search_rate_limit", {
      p_identity_hash: rateLimitIdentity(identity),
      p_is_authenticated: Boolean(user),
    });
    if (limitError) {
      console.error("Search rate limiter unavailable:", limitError);
      return NextResponse.json({ error: "Search is temporarily unavailable", code: "SEARCH_LIMITER_UNAVAILABLE" }, { status: 503 });
    }

    const rate = Array.isArray(limitData) ? limitData[0] : limitData;
    if (!rate) {
      return NextResponse.json({ error: "Search is temporarily unavailable", code: "SEARCH_LIMITER_UNAVAILABLE" }, { status: 503 });
    }
    const limit = Number(rate.active_limit);
    const remaining = Number(rate.remaining_minute);
    const dailyLimit = user ? 1200 : 300;
    const headers = responseHeaders(limit, remaining, dailyLimit, Number(rate.remaining_day));

    if (!rate.allowed) {
      const retryAfter = Math.max(1, Number(rate.retry_after_seconds) || 1);
      return NextResponse.json({
        error: "تکایە کەمێک چاوەڕێ بکە و دووبارە هەوڵ بدەرەوە.",
        code: "SEARCH_RATE_LIMITED",
        retryAfterSeconds: retryAfter,
      }, {
        status: 429,
        headers: { ...headers, "Retry-After": String(retryAfter), "RateLimit-Reset": String(retryAfter) },
      });
    }

    // Remove PostgREST filter syntax and wildcard characters before composing
    // this OR expression. Query length is bounded above and matches are limited.
    const pattern = `%${query}%`;
    const topicTags = [...new Set(findPostTopics(rawQuery.slice(0, MAX_QUERY_LENGTH))
      .flatMap(({ id }) => [id, id.toLowerCase()]))];
    const postQuery = supabase.from("posts")
      .select("id,content,media_url,created_at,profiles:author_id(id,sequential_id,username,full_name,avatar_url)")
      .eq("privacy", "public");
    const matchingPosts = topicTags.length
      ? postQuery.or(`content.ilike."${pattern}",tags.ov.{${topicTags.join(",")}}`)
      : postQuery.ilike("content", pattern);
    const [userResult, postResult] = await Promise.all([
      supabase.from("profiles")
        .select("id,sequential_id,username,full_name,avatar_url,role,followers_count")
        .or(`username.ilike.${pattern},full_name.ilike.${pattern}`)
        .order("followers_count", { ascending: false })
        .limit(RESULT_LIMIT),
      matchingPosts
        .order("created_at", { ascending: false })
        .limit(RESULT_LIMIT),
    ]);

    if (userResult.error) throw userResult.error;
    if (postResult.error) throw postResult.error;

    const users = (userResult.data || []).map((profile: SearchProfileRow) => ({
      id: String(profile.sequential_id || profile.id),
      name: profile.full_name || profile.username || "بەکارهێنەری پۆلا",
      handle: `@${profile.username || "user"}`,
      avatar: profile.avatar_url || "",
      subtitle: profile.role || "ئەندامی پۆلا",
      followersCount: Number(profile.followers_count || 0),
    }));

    const posts = (postResult.data || []).map((post: SearchPostRow) => {
      const profile = (Array.isArray(post.profiles) ? post.profiles[0] : post.profiles) || {
        id: "",
        sequential_id: null,
        username: null,
        full_name: null,
        avatar_url: null,
      };
      return {
        id: post.id,
        content: post.content || "",
        mediaUrl: post.media_url || null,
        createdAt: post.created_at,
        author: {
          id: String(profile.sequential_id || profile.id || ""),
          name: profile.full_name || profile.username || "بەکارهێنەر",
          avatar: profile.avatar_url || "",
        },
      };
    });

    return NextResponse.json({ users, posts }, { headers });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json({ error: "نەتوانرا گەڕان ئەنجام بدرێت" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
