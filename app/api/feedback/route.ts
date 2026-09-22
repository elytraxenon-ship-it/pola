import { NextRequest, NextResponse } from "next/server";
import { mockDb, FeedbackRecord } from "@/lib/mock-api-db";

// POST /api/feedback - Submit feedback with 1 per day limit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedback, message, rating, userId } = body;
    const contentText = (feedback || message || "") as string;

    if (!contentText || typeof contentText !== "string" || !contentText.trim()) {
      return NextResponse.json(
        { error: "تکایە سەرنجەکەت بنووسە پێش ناردن" },
        { status: 400 }
      );
    }

    // Determine unique client key (userId, or IP / header fallback)
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "client-anon";
    const userIdentifier = userId || clientIp;

    const todayKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Enforce 1 feedback per day limit
    if (mockDb.hasFeedbackToday(userIdentifier, todayKey)) {
      return NextResponse.json(
        {
          error: "تەنها یەکجار لە ڕۆژێکدا دەتوانیت سەرنج بنێریت! سوپاس بۆ بەشداریت.",
          code: "DAILY_LIMIT_REACHED",
        },
        { status: 429 }
      );
    }

    const newFeedback: FeedbackRecord = {
      id: `fb-${Date.now()}`,
      feedback: feedback.trim(),
      rating: typeof rating === "number" ? rating : 5,
      userId: userIdentifier,
      timestamp: new Date().toISOString(),
      dateKey: todayKey,
    };

    mockDb.addFeedback(newFeedback);

    return NextResponse.json(
      {
        success: true,
        message: "سەرنجەکەت بە سەرکەوتوویی تۆمارکرا! زۆر سوپاس بۆ هاوکاریت.",
        record: newFeedback,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "هەڵەیەک ڕوویدا لە تۆمارکردنی سەرنجەکەت" },
      { status: 500 }
    );
  }
}

// GET /api/feedback - List all feedbacks
export async function GET() {
  return NextResponse.json(mockDb.getFeedbacks());
}
