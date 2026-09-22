import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mock-api-db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/posts/[id]/repost - Toggle/increment repost
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const post = mockDb.getPostById(id);

  if (!post) {
    return NextResponse.json(
      { error: "پۆستەکە نەدۆزرایەوە" },
      { status: 404 }
    );
  }

  const updated = mockDb.toggleRepost(id);

  return NextResponse.json({
    success: true,
    sharesCount: updated?.sharesCount ?? post.sharesCount + 1,
    message: "پۆستەکە لە پەڕەی تۆ دەنگدانەوەی پەیدا کرد!",
  });
}
