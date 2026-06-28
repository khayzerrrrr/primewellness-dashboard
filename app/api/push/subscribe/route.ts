import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const { subscription, userId } = await req.json();
    if (!subscription || !userId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }
    await addDoc(collection(db, "push_subscriptions"), {
      userId,
      subscription,
      createdAt: Timestamp.now(),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
