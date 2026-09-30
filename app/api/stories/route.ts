import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteFromR2, uploadToR2 } from "@/lib/r2";
import { getStoryObjectKey } from "@/lib/story-storage";
import { Story, User } from "@/components/feed/types";

const STORY_UPLOAD_LIMIT = 3 * 1024 * 1024;

function toStory(row: any): Story {
  const profile = row.profiles || {};
  const author: User = {
    id: String(profile.sequential_id || profile.id || row.user_id),
    name: profile.full_name || profile.username || "بەکارهێنەر",
    handle: `@${profile.username || "user"}`,
    avatar: profile.avatar_url || "",
  };

  return {
    id: row.id,
    author,
    mediaUrl: `/api/stories/${encodeURIComponent(row.id)}/media`,
    caption: row.caption || "",
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "تکایە سەرەتا بچۆ ژوورەوە" }, {
        status: 401,
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    // Row-level security limits this query to the current user's stories and
    // stories belonging to profiles they follow.
    const { data, error } = await supabase
      .from("stories")
      .select("id,user_id,caption,created_at,expires_at,profiles!stories_user_id_fkey(id,sequential_id,username,full_name,avatar_url)")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json((data || []).map(toStory), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("GET /api/stories error:", error);
    return NextResponse.json({ error: "نەتوانرا ساتەکان باربکرێن" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  let storageKey: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "تکایە سەرەتا بچۆ ژوورەوە" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");
    const rawCaption = formData.get("caption");
    const caption = typeof rawCaption === "string" ? rawCaption.trim() : "";
    if (Array.from(caption).length > 280) {
      return NextResponse.json({ error: "دەقی سات نابێت لە ٢٨٠ پیت زیاتر بێت" }, { status: 400 });
    }
    if (!(file instanceof File) || !file.size) {
      return NextResponse.json({ error: "وێنەیەک هەڵبژێرە" }, { status: 400 });
    }
    if (file.type !== "image/webp" || file.size > STORY_UPLOAD_LIMIT) {
      return NextResponse.json({ error: "وێنەکە پێویستە WebP بێت و لە ٣ مێگابایت بچووکتر بێت" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (
      bytes.length < 12 ||
      bytes.toString("ascii", 0, 4) !== "RIFF" ||
      bytes.toString("ascii", 8, 12) !== "WEBP"
    ) {
      return NextResponse.json({ error: "ناوەڕۆکی پەڕگەکە وێنەی WebP نییە" }, { status: 400 });
    }

    const { count, error: countError } = await supabase
      .from("stories")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString());
    if (countError) throw countError;
    if ((count ?? 0) >= 20) {
      return NextResponse.json({ error: "٢٠ ساتی چالاکت هەیە؛ پێش زیادکردنی ساتێکی نوێ چاوەڕێی بەسەرچوونی یەکێکیان بکە." }, { status: 429 });
    }

    const storyId = crypto.randomUUID();
    storageKey = getStoryObjectKey(user.id, storyId);
    await uploadToR2("post", storageKey, bytes, "image/webp");

    const { data: story, error } = await supabase
      .from("stories")
      .insert({ id: storyId, user_id: user.id, caption })
      .select("id,user_id,caption,created_at,expires_at,profiles!stories_user_id_fkey(id,sequential_id,username,full_name,avatar_url)")
      .single();

    if (error) {
      if (error.code === "23514" && error.message.includes("ACTIVE_STORY_LIMIT")) {
        await deleteFromR2("post", storageKey).catch(() => {});
        storageKey = null;
        return NextResponse.json({ error: "٢٠ ساتی چالاکت هەیە؛ پێش زیادکردنی ساتێکی نوێ چاوەڕێی بەسەرچوونی یەکێکیان بکە." }, { status: 429 });
      }
      throw error;
    }

    return NextResponse.json(toStory(story), {
      status: 201,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (storageKey) await deleteFromR2("post", storageKey).catch(() => {});
    console.error("POST /api/stories error:", error);
    return NextResponse.json({ error: "نەتوانرا ساتەکە بڵاو بکرێتەوە" }, { status: 500 });
  }
}
