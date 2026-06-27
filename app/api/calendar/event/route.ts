import { type NextRequest, NextResponse } from "next/server";
import { createCalendarEvent, updateCalendarEvent } from "@/lib/google-calendar";

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    return NextResponse.json({ error: "Google Calendar belum terhubung." }, { status: 503 });
  }
  try {
    const data = await req.json();
    const eventId = data.googleEventId
      ? await updateCalendarEvent(data)
      : await createCalendarEvent(data);
    return NextResponse.json({ eventId });
  } catch (err) {
    console.error("[calendar/event]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
