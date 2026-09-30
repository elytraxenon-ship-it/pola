import { NextRequest, NextResponse } from "next/server";
import { getObjectFromR2 } from "@/lib/r2";
import { Readable } from "stream";

const ALLOWED_BUCKETS = new Set(["avatar", "banner", "post"]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string; key: string[] }> }
) {
  try {
    const { bucket, key } = await params;
    const fullKey = Array.isArray(key) ? key.join("/") : key;

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Story objects must go through the expiry-aware endpoint.
    if (bucket === "post" && fullKey.startsWith("stories/")) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const response = await getObjectFromR2(bucket, fullKey);
    if (!response.Body) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const contentType = response.ContentType || "image/webp";
    const cacheControl = "public, max-age=31536000, immutable";

    // Convert aws SDK Body to Web ReadableStream
    let bodyStream: ReadableStream;
    if (response.Body instanceof Readable) {
      const nodeStream = response.Body;
      bodyStream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk) => controller.enqueue(chunk));
          nodeStream.on("end", () => controller.close());
          nodeStream.on("error", (err) => controller.error(err));
        },
      });
    } else if (typeof (response.Body as any).transformToWebStream === "function") {
      bodyStream = (response.Body as any).transformToWebStream();
    } else {
      const bytes = await response.Body.transformToByteArray();
      return new NextResponse(Buffer.from(bytes), {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": cacheControl,
        },
      });
    }

    return new NextResponse(bodyStream, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
      },
    });
  } catch (err: any) {
    if (err?.name === "NoSuchKey" || err?.$metadata?.httpStatusCode === 404) {
      return new NextResponse("Image Not Found", { status: 404 });
    }
    console.error("[Media Proxy Error]:", err);
    return new NextResponse("Failed to load media", { status: 500 });
  }
}
