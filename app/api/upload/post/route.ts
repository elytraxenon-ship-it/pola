import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadToR2 } from "@/lib/r2";

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
      return NextResponse.json({ error: "تەنها پەڕگەی وێنە بۆ پۆست ڕێگەپێدراوە" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "قەبارەی وێنە زۆر گەورەیە" }, { status: 400 });
    }

    // Upload post image to R2 'post' bucket
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const key = `${user.id}/${Date.now()}.webp`;

    const publicUrl = await uploadToR2("post", key, buffer, file.type || "image/webp");

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("[Post Media Upload Error]:", error);
    return NextResponse.json(
      { error: error?.message || "هەڵەیەک لە بارکردنی وێنەی پۆست ڕوویدا" },
      { status: 500 }
    );
  }
}
