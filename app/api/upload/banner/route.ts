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

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "قەبارەی وێنە لە 8 مێگابایت زیاترە" }, { status: 400 });
    }

    // 1. Fetch current profile to get old cover_url
    const { data: profile } = await supabase
      .from("profiles")
      .select("cover_url")
      .eq("id", user.id)
      .maybeSingle();

    const oldCoverUrl = profile?.cover_url;

    // 2. Upload new banner to R2 'banner' bucket
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const key = `${user.id}/${Date.now()}.webp`;

    const publicUrl = await uploadToR2("banner", key, buffer, file.type || "image/webp");

    // 3. Delete old banner from R2 if it was an R2 file
    if (oldCoverUrl) {
      const oldR2 = extractR2BucketAndKey(oldCoverUrl);
      if (oldR2 && (oldR2.bucket === "banner" || oldR2.bucket === "banners")) {
        try {
          await deleteFromR2(oldR2.bucket, oldR2.key);
        } catch (delErr) {
          console.warn("[R2] Failed to delete old banner:", delErr);
        }
      }
    }

    // 4. Update profile in database
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        cover_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[Banner Upload DB Error]:", updateError);
      return NextResponse.json({ error: "هەڵە لە تۆمارکردنی وێنەی بەرگ" }, { status: 500 });
    }

    // 5. Invalidate profile cache
    try {
      revalidateCacheTag(CACHE_TAGS.profile(user.id));
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("[Banner Upload Error]:", error);
    return NextResponse.json(
      { error: error?.message || "هەڵەیەک لە بارکردنی وێنەدا ڕوویدا" },
      { status: 500 }
    );
  }
}
