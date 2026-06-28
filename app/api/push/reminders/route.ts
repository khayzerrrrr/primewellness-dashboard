import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import webpush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@primewellness.id";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

async function sendPushToUser(userId: string, title: string, body: string, url: string) {
  const snap = await getDocs(query(
    collection(db, "push_subscriptions"),
    where("userId", "==", userId)
  ));
  const payload = JSON.stringify({ title, body, url });
  await Promise.all(snap.docs.map(async (d) => {
    const sub = d.data().subscription as webpush.PushSubscription;
    try { await webpush.sendNotification(sub, payload); } catch { /* ignore stale subscriptions */ }
  }));
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);

  let sent = 0;

  try {
    // H-1 reminders: appointments tomorrow
    const h1Snap = await getDocs(query(
      collection(db, "appointments"),
      where("date", ">=", Timestamp.fromDate(tomorrow)),
      where("date", "<=", Timestamp.fromDate(tomorrowEnd)),
      where("status", "in", ["pending", "confirmed"])
    ));

    for (const d of h1Snap.docs) {
      const app = d.data();
      if (app.patientId) {
        await sendPushToUser(
          app.patientId as string,
          "Pengingat Janji Terapi",
          `Terapi ${app.serviceName || ""} Anda dijadwalkan besok pukul ${app.timeSlot || ""}. Pastikan Anda hadir tepat waktu!`,
          "/patient/appointments"
        );
        sent++;
      }
    }

    // H-0 reminders: appointments within the next 2 hours
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const h0Snap = await getDocs(query(
      collection(db, "appointments"),
      where("date", ">=", Timestamp.fromDate(now)),
      where("date", "<=", Timestamp.fromDate(twoHoursLater)),
      where("status", "in", ["pending", "confirmed"])
    ));

    for (const d of h0Snap.docs) {
      const app = d.data();
      if (app.patientId) {
        await sendPushToUser(
          app.patientId as string,
          "Terapi Anda Segera Dimulai",
          `Terapi ${app.serviceName || ""} Anda akan dimulai pukul ${app.timeSlot || ""}. Harap segera hadir ke klinik.`,
          "/patient/appointments"
        );
        sent++;
      }
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
