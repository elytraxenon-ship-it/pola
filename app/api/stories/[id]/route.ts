import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteFromR2 } from "@/lib/r2";
import { getStoryObjectKey } from "@/lib/story-storage";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "ساتەکە نەدۆزرایەوە" }, { status: 404 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "تکایە سەرەتا بچۆ ژوورەوە" }, { status: 401 });

    const { data: story, error: lookupError } = await supabase
      .from("stories")
      .select("id,user_id")
      .eq("id", id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!story) return NextResponse.json({ error: "ساتەکە نەدۆزرایەوە" }, { status: 404 });
    if (story.user_id !== user.id) return NextResponse.json({ error: "تەنها خاوەنی سات دەتوانێت بیسڕێتەوە" }, { status: 403 });

    const { data: deleted, error: deleteError } = await supabase
      .from("stories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();
    if (deleteError) throw deleteError;
    if (!deleted) return NextResponse.json({ error: "ساتەکە پێشتر سڕاوەتەوە" }, { status: 404 });

    try {
      await deleteFromR2("post", getStoryObjectKey(user.id, id));
    } catch (storageError) {
      // Metadata is already removed, so nobody can read the story. The bucket's
      // lifecycle policy will reclaim an orphaned object if R2 is temporarily down.
      console.error("Story image cleanup failed:", storageError);
    }

    return NextResponse.json({ success: true }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("DELETE /api/stories/[id] error:", error);
    return NextResponse.json({ error: "نەتوانرا ساتەکە بسڕدرێتەوە" }, { status: 500 });
  }
}
