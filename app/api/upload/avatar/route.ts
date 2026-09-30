import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadToR2, deleteFromR2, extractR2BucketAndKey } from "@/lib/r2";
import { CACHE_TAGS, revalidateCacheTag } from "@/lib/cache";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "تکایە سەرەتا بچۆ ژوورەوە" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "هیچ وێنەیەک دیاری نەکراوە" }, { status: 400 });
    }

    // Safety checks
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "تەنها پەڕگەی وێنە قبوڵ دەکرێت" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "قەبارەی وێنە لە 5 مێگابایت زیاترە" }, { status: 400 });
    }

    // 1. Fetch current profile to get old avatar_url
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, sequential_id")
      .eq("id", user.id)
      .maybeSingle();

    const oldAvatarUrl = profile?.avatar_url;

    // 2. Upload new avatar to R2 'avatar' bucket
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const key = `${user.id}/${Date.now()}.webp`;

    const publicUrl = await uploadToR2("avatar", key, buffer, file.type || "image/webp");

    // 3. Delete old avatar from R2 if it was an R2 file
    if (oldAvatarUrl) {
      const oldR2 = extractR2BucketAndKey(oldAvatarUrl);
      if (oldR2 && (oldR2.bucket === "avatar" || oldR2.bucket === "avatars")) {
        try {
          await deleteFromR2(oldR2.bucket, oldR2.key);
        } catch (delErr) {
          console.warn("[R2] Failed to delete old avatar:", delErr);
        }
      }
    }

    // 4. Update profile in database
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[Avatar Upload DB Error]:", updateError);
      return NextResponse.json({ error: "هەڵە لە تۆمارکردنی وێنەی پرۆفایل" }, { status: 500 });
    }

    // 5. Invalidate profile cache
    try {
      revalidateCacheTag(CACHE_TAGS.profile(user.id));
      if (profile?.sequential_id) revalidateCacheTag(CACHE_TAGS.profile(String(profile.sequential_id)));
      revalidateCacheTag(CACHE_TAGS.feed);
    } catch (e) {
      // ignore in environments without active tag cache
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("[Avatar Upload Error]:", error);
    return NextResponse.json(
      { error: error?.message || "هەڵەیەک لە بارکردنی وێنەدا ڕوویدا" },
      { status: 500 }
    );
  }
}
