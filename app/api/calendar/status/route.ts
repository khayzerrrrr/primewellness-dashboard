import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ connected: !!process.env.GOOGLE_REFRESH_TOKEN });
}
