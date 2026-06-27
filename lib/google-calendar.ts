import { google } from "googleapis";

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
  );
}

export function getAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar"],
    prompt: "consent",
  });
}

export function isCalendarConnected(): boolean {
  return !!process.env.GOOGLE_REFRESH_TOKEN;
}

export async function getCalendarClient() {
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error("GOOGLE_REFRESH_TOKEN belum diset. Buka /api/calendar/auth untuk setup.");
  }
  const client = getOAuth2Client();
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: "v3", auth: client });
}

export interface CalendarEventPayload {
  appointmentId: string;
  bookingNumber: string;
  patientName: string;
  patientEmail?: string;
  doctorName: string;
  serviceName: string;
  date: string; // ISO string
  timeSlot: string; // "09:00"
  durationMinutes: number;
  notes?: string;
  googleEventId?: string;
}

function buildEvent(data: CalendarEventPayload) {
  const [h, m] = data.timeSlot.split(":").map(Number);
  const start = new Date(data.date);
  start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + data.durationMinutes * 60_000);

  const attendees = data.patientEmail
    ? [{ email: data.patientEmail, displayName: data.patientName }]
    : [];

  return {
    summary: `[${data.bookingNumber}] ${data.patientName} – ${data.serviceName}`,
    description: [
      `No. Booking : ${data.bookingNumber}`,
      `Pasien      : ${data.patientName}`,
      `Layanan     : ${data.serviceName}`,
      `Terapis     : ${data.doctorName}`,
      data.notes ? `Catatan     : ${data.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    start: { dateTime: start.toISOString(), timeZone: "Asia/Jakarta" },
    end: { dateTime: end.toISOString(), timeZone: "Asia/Jakarta" },
    attendees,
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 60 },
        { method: "popup", minutes: 30 },
      ],
    },
  };
}

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? "primary";

export async function createCalendarEvent(data: CalendarEventPayload): Promise<string | null> {
  const cal = await getCalendarClient();
  const res = await cal.events.insert({
    calendarId: CALENDAR_ID,
    sendUpdates: "all",
    requestBody: buildEvent(data),
  });
  return res.data.id ?? null;
}

export async function updateCalendarEvent(data: CalendarEventPayload): Promise<string | null> {
  if (!data.googleEventId) return createCalendarEvent(data);
  const cal = await getCalendarClient();
  const res = await cal.events.update({
    calendarId: CALENDAR_ID,
    eventId: data.googleEventId,
    sendUpdates: "all",
    requestBody: buildEvent(data),
  });
  return res.data.id ?? null;
}

export async function cancelCalendarEvent(googleEventId: string): Promise<void> {
  const cal = await getCalendarClient();
  await cal.events.patch({
    calendarId: CALENDAR_ID,
    eventId: googleEventId,
    sendUpdates: "all",
    requestBody: { status: "cancelled" },
  });
}
