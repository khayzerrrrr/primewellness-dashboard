import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID atau GOOGLE_CLIENT_SECRET belum diset di environment variables." },
      { status: 500 }
    );
  }
  return NextResponse.redirect(getAuthUrl());
}
