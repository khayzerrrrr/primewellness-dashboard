import { type NextRequest, NextResponse } from "next/server";
import { cancelCalendarEvent } from "@/lib/google-calendar";

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    return NextResponse.json({ ok: true }); // silent skip if not connected
  }
  try {
    const { googleEventId } = await req.json();
    if (googleEventId) await cancelCalendarEvent(googleEventId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[calendar/cancel]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
