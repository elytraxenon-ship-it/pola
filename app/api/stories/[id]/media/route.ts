import { NextResponse } from "next/server";
import { Readable } from "stream";
import { getObjectFromR2 } from "@/lib/r2";
import { getStoryObjectKey } from "@/lib/story-storage";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const supabase = await createClient();
    const { data: story, error } = await supabase
      .from("stories")
      .select("id,user_id")
      .eq("id", id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error || !story) return new NextResponse("Story expired or not found", { status: 404 });

    const object = await getObjectFromR2("post", getStoryObjectKey(story.user_id, story.id));
    if (!object.Body) return new NextResponse("Not Found", { status: 404 });
    const headers = {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    };

    if ((object.Body as any) instanceof Readable) {
      const bodyStream = object.Body as any as Readable;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          bodyStream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
          bodyStream.on("end", () => controller.close());
          bodyStream.on("error", (error: Error) => controller.error(error));
        },
        cancel() { bodyStream.destroy(); },
      });
      return new NextResponse(body, { headers });
    }

    const bytes = await (object.Body as any).transformToByteArray();
    return new NextResponse(Buffer.from(bytes), { headers });
  } catch (error) {
    console.error("GET /api/stories/[id]/media error:", error);
    return new NextResponse("Could not load story image", { status: 503 });
  }
}
