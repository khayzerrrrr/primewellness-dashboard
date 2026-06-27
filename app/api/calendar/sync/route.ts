import { type NextRequest, NextResponse } from "next/server";
import { createCalendarEvent, updateCalendarEvent } from "@/lib/google-calendar";

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    return NextResponse.json({ error: "Google Calendar belum terhubung." }, { status: 503 });
  }
  try {
    const { appointments } = await req.json() as {
      appointments: Array<{
        id: string;
        appointmentId: string;
        bookingNumber: string;
        patientName: string;
        patientEmail?: string;
        doctorName: string;
        serviceName: string;
        date: string;
        timeSlot: string;
        durationMinutes: number;
        notes?: string;
        googleEventId?: string;
      }>;
    };

    const results: Array<{ id: string; eventId: string | null; error?: string }> = [];

    for (const appt of appointments) {
      try {
        const eventId = appt.googleEventId
          ? await updateCalendarEvent(appt)
          : await createCalendarEvent(appt);
        results.push({ id: appt.id, eventId });
      } catch (err) {
        results.push({ id: appt.id, eventId: null, error: String(err) });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[calendar/sync]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
