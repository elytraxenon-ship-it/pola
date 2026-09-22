import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createClient, createStaticClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/mock-api-db";
import { CACHE_TAGS, CACHE_TTL, revalidateCacheTag } from "@/lib/cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function fetchUserProfile(id: string) {
  const supabase = createStaticClient();

  // Check if query is numeric sequential_id or UUID
  const isNumeric = /^\d+$/.test(id);
  let query = supabase.from("profiles").select("*");

  if (isNumeric) {
    query = query.eq("sequential_id", parseInt(id, 10));
  } else {
    query = query.eq("id", id);
  }

  const { data: profile, error } = await query.maybeSingle();

  if (profile && !error) {
    return {
      id: String(profile.sequential_id || profile.id),
      uuid: profile.id,
      name: profile.full_name || profile.username || "بەکارهێنەری پۆلا",
      handle: `@${profile.username || "user"}`,
      avatar:
        profile.avatar_url ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      coverPhoto:
        profile.cover_url ||
        "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?auto=format&fit=crop&w=1600&q=80",
      bio: profile.bio || "ئەندامی کۆمەڵگەی پۆلا",
      location: profile.location || "کوردستان",
      role: profile.role || "داهێنەری نوێ",
      joinedDate: new Date(profile.created_at).toLocaleDateString("ckb", {
        year: "numeric",
        month: "long",
      }),
      website: profile.website || "",
      stats: {
        posts: profile.posts_count || 0,
        followers: String(profile.followers_count || 0),
        following: profile.following_count || 0,
      },
      verified: true,
      online: true,
    };
  }

  return null;
}

const getCachedProfile = (id: string) =>
  unstable_cache(
    async () => fetchUserProfile(id),
    [`user-profile-${id}`],
    { tags: [CACHE_TAGS.profile(id)], revalidate: CACHE_TTL }
  )();

// GET /api/users/[id] - Fetch user profile with 5-minute caching
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const profile = await getCachedProfile(id);
    if (profile) {
      return NextResponse.json(profile);
    }
  } catch (error) {
    console.error("GET /api/users/[id] Supabase cache error:", error);
  }

  // Fallback to local mockDb
  const fallback = mockDb.getUser(id);
  if (!fallback) {
    return NextResponse.json(
      { error: "بەکارهێنەر نەدۆزرایەوە" },
      { status: 404 }
    );
  }

  return NextResponse.json(fallback);
}

// PATCH /api/users/[id] - Update user profile with strict location validation & cache invalidation
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "تکایە سەرەتا بچۆ ژوورەوە" }, { status: 401 });
    }

    const body = await request.json();
    const allowedUpdates: Record<string, any> = {};

    // Strict server-side validation if location is present in update
    if (body.location !== undefined) {
      const { isValidKurdishLocation, sanitizeKurdishLocation } = await import("@/lib/kurdish-cities");
      
      const sanitizedLoc = sanitizeKurdishLocation(body.location);
      if (!sanitizedLoc || !isValidKurdishLocation(sanitizedLoc)) {
        return NextResponse.json(
          {
            error: "شوێن نادروستە! پێویستە ناوی شارێکی دروستی کوردستان بێت بە شێوازی (شار، کوردستان). وەک: هەولێر، کوردستان",
          },
          { status: 400 }
        );
      }
      allowedUpdates.location = sanitizedLoc;
    }

    if (body.full_name !== undefined) allowedUpdates.full_name = body.full_name.trim();
    if (body.username !== undefined) allowedUpdates.username = body.username.trim();
    if (body.role !== undefined) allowedUpdates.role = body.role.trim();
    if (body.bio !== undefined) allowedUpdates.bio = body.bio.trim();
    if (body.website !== undefined) allowedUpdates.website = body.website.trim();
    // Note: avatar_url and cover_url are uploaded through /api/upload/avatar and /api/upload/banner
    allowedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("profiles")
      .update(allowedUpdates)
      .eq("id", user.id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate cached profile and feed
    try {
      revalidateCacheTag(CACHE_TAGS.profile(user.id));
      if (data?.sequential_id) {
        revalidateCacheTag(CACHE_TAGS.profile(String(data.sequential_id)));
      }
      revalidateCacheTag(CACHE_TAGS.feed);
    } catch (e) {}

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "هەڵەیەک ڕوویدا" }, { status: 500 });
  }
}
