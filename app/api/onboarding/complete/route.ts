import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidKurdishLocation, sanitizeKurdishLocation } from "@/lib/kurdish-cities";
import { CACHE_TAGS, revalidateCacheTag } from "@/lib/cache";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "تکایە سەرەتا بچۆ ژوورەوە" }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, username, avatar_url, cover_url, bio, location } = body;

    // Strict Server-Side Location Validation
    if (!location || !isValidKurdishLocation(location)) {
      return NextResponse.json(
        {
          error: "شوێنەکە نادروستە! فۆرمات دەبێت بەم شێوازە بێت: (شار، کوردستان)",
        },
        { status: 400 }
      );
    }

    const sanitizedLoc = sanitizeKurdishLocation(location);
    if (!sanitizedLoc) {
      return NextResponse.json(
        {
          error: "تکایە شارێکی دروستی کوردستان هەڵبژێرە بە شێوازی (شار، کوردستان)",
        },
        { status: 400 }
      );
    }

    // Update profile in Supabase
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: full_name?.trim() || user.user_metadata?.full_name || "بەکارهێنەری پۆلا",
        username: username?.trim() || `user_${user.id.slice(0, 6)}`,
        avatar_url: avatar_url || undefined,
        cover_url: cover_url || undefined,
        bio: bio?.trim() || "ئەندامی نوێی کۆمەڵگەی پۆلا ✨",
        location: sanitizedLoc,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    try {
      revalidateCacheTag(CACHE_TAGS.profile(user.id));
      revalidateCacheTag(CACHE_TAGS.feed);
    } catch (e) {}

    return NextResponse.json({ success: true, location: sanitizedLoc });
  } catch (err: any) {
    console.error("Onboarding completion API error:", err);
    return NextResponse.json({ error: "هەڵەیەک لە سێرڤەردا ڕوویدا" }, { status: 500 });
  }
}
