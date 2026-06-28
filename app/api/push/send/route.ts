import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, url } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    // In production: fetch subscriptions from Firestore and send via web-push
    // For now, return ok (client-side Notification API handles it)
    console.log("[push/send] Notification queued for user:", userId, { title, body, url });
    return NextResponse.json({ ok: true, message: "Notification queued" });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
