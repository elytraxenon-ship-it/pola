import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CACHE_TAGS, revalidateCacheTag } from "@/lib/cache";

interface RouteParams { params: Promise<{ id: string }> }

async function resolveProfile(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const numeric = /^\d+$/.test(id);
  const query = supabase.from("profiles").select("id, sequential_id, followers_count");
  return numeric
    ? query.eq("sequential_id", Number(id)).maybeSingle()
    : query.eq("id", id).maybeSingle();
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile, error: profileError } = await resolveProfile(supabase, id);
    if (profileError) throw profileError;
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    if (!user || user.id === profile.id) {
      return NextResponse.json({ isFollowing: false, followersCount: profile.followers_count ?? 0 }, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const { data: follow, error } = await supabase.from("profile_follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .maybeSingle();
    if (error) throw error;

    return NextResponse.json({ isFollowing: Boolean(follow), followersCount: profile.followers_count ?? 0 }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("GET /api/users/[id]/follow error:", error);
    return NextResponse.json({ error: "Follow state is unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (typeof body.isFollowing !== "boolean") {
    return NextResponse.json({ error: "isFollowing must be a boolean" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to follow profiles" }, { status: 401 });

    // The database RPC uses an atomic per-user counter, so limits are shared
    // across tabs, serverless instances, and simultaneous follow/unfollow calls.
    const { data: rateLimitData, error: rateLimitError } = await supabase.rpc("consume_profile_follow_rate_limit");
    if (rateLimitError) {
      console.error("Profile follow rate limit unavailable:", rateLimitError);
      return NextResponse.json({ error: "Follow service is temporarily unavailable" }, { status: 503 });
    }
    const rateLimit = Array.isArray(rateLimitData) ? rateLimitData[0] : rateLimitData;
    if (!rateLimit) {
      return NextResponse.json({ error: "Follow service is temporarily unavailable" }, { status: 503 });
    }
    const rateLimitHeaders = {
      "RateLimit-Policy": "20;w=60, 200;w=86400",
      "RateLimit-Limit": String(rateLimit.active_limit),
      "RateLimit-Remaining": String(rateLimit.allowed
        ? (rateLimit.active_limit === 200 ? rateLimit.remaining_day : rateLimit.remaining_minute)
        : 0),
      "Cache-Control": "private, no-store",
    };
    if (!rateLimit.allowed) {
      const retryAfter = Math.max(1, Number(rateLimit.retry_after_seconds) || 60);
      return NextResponse.json({
        error: "زۆر خێرا فۆڵۆو و لادەکەیت. کەمێک چاوەڕێ بکە و دووبارە هەوڵ بدەرەوە.",
        code: "FOLLOW_RATE_LIMITED",
        retryAfterSeconds: retryAfter,
      }, {
        status: 429,
        headers: { ...rateLimitHeaders, "Retry-After": String(retryAfter), "RateLimit-Reset": String(retryAfter) },
      });
    }

    const { data: target, error: targetError } = await resolveProfile(supabase, id);
    if (targetError) throw targetError;
    if (!target) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    if (target.id === user.id) return NextResponse.json({ error: "You cannot follow your own profile" }, { status: 400 });

    if (body.isFollowing) {
      const { error } = await supabase.from("profile_follows").upsert(
        { follower_id: user.id, following_id: target.id },
        { onConflict: "follower_id,following_id", ignoreDuplicates: true },
      );
      if (error) throw error;
    } else {
      const { error } = await supabase.from("profile_follows").delete()
        .eq("follower_id", user.id)
        .eq("following_id", target.id);
      if (error) throw error;
    }

    const [{ data: freshTarget, error: countError }, { data: actor }] = await Promise.all([
      supabase.from("profiles").select("followers_count").eq("id", target.id).maybeSingle(),
      supabase.from("profiles").select("sequential_id").eq("id", user.id).maybeSingle(),
    ]);
    if (countError) throw countError;

    try {
      revalidateCacheTag(CACHE_TAGS.profile(target.id));
      revalidateCacheTag(CACHE_TAGS.profile(String(target.sequential_id)));
      revalidateCacheTag(CACHE_TAGS.profile(user.id));
      if (actor?.sequential_id) revalidateCacheTag(CACHE_TAGS.profile(String(actor.sequential_id)));
    } catch {}

    return NextResponse.json({
      isFollowing: body.isFollowing,
      followersCount: freshTarget?.followers_count ?? target.followers_count ?? 0,
    }, { headers: rateLimitHeaders });
  } catch (error) {
    console.error("POST /api/users/[id]/follow error:", error);
    return NextResponse.json({ error: "Could not update follow status" }, { status: 503 });
  }
}
