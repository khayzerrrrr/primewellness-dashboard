import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import webpush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@primewellness.id";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, url } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
    }

    const snap = await getDocs(query(
      collection(db, "push_subscriptions"),
      where("userId", "==", userId)
    ));

    const payload = JSON.stringify({ title, body, url: url || "/" });
    const results: { success: boolean; error?: string }[] = [];

    await Promise.all(snap.docs.map(async (d) => {
      const sub = d.data().subscription as webpush.PushSubscription;
      try {
        await webpush.sendNotification(sub, payload);
        results.push({ success: true });
      } catch (err) {
        results.push({ success: false, error: String(err) });
      }
    }));

    return NextResponse.json({ ok: true, sent: results.filter(r => r.success).length, total: results.length });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
