import { NextRequest, NextResponse } from "next/server";

const WA_API_KEY = process.env.WHATSAPP_API_KEY;
const WA_API_URL = process.env.WHATSAPP_API_URL || "https://api.fonnte.com/send";

type NotifType = "booking_created" | "booking_confirmed" | "reminder" | "invoice";

interface WaData {
  bookingNumber?: string;
  patientName?: string;
  serviceName?: string;
  doctorName?: string;
  date?: string;
  time?: string;
  invoiceNumber?: string;
  total?: string;
}

function buildMessage(type: NotifType, data: WaData): string {
  switch (type) {
    case "booking_created":
      return `Halo ${data.patientName}! 👋

✅ *Booking Berhasil Dibuat*
━━━━━━━━━━━━━━━━━━━
📋 Nomor Booking: *${data.bookingNumber}*
🏥 Layanan: ${data.serviceName}
👨‍⚕️ Dokter: ${data.doctorName}
📅 Tanggal: ${data.date}
⏰ Jam: ${data.time}
━━━━━━━━━━━━━━━━━━━

Booking Anda sedang menunggu konfirmasi. Kami akan menghubungi Anda dalam 1x24 jam.

Harap hadir 15 menit sebelum jadwal.

_Prime Wellness - Your Trusted Wellness Partner_`;

    case "booking_confirmed":
      return `Halo ${data.patientName}! 👋

✅ *Booking Dikonfirmasi*
━━━━━━━━━━━━━━━━━━━
📋 Nomor Booking: *${data.bookingNumber}*
🏥 Layanan: ${data.serviceName}
👨‍⚕️ Dokter: ${data.doctorName}
📅 Tanggal: ${data.date}
⏰ Jam: ${data.time}
━━━━━━━━━━━━━━━━━━━

Booking Anda telah *DIKONFIRMASI*. Sampai jumpa! 🌟

_Prime Wellness - Your Trusted Wellness Partner_`;

    case "reminder":
      return `Halo ${data.patientName}! 👋

⏰ *Reminder Appointment Besok*
━━━━━━━━━━━━━━━━━━━
📋 Nomor Booking: *${data.bookingNumber}*
🏥 Layanan: ${data.serviceName}
👨‍⚕️ Dokter: ${data.doctorName}
📅 Tanggal: ${data.date}
⏰ Jam: ${data.time}
━━━━━━━━━━━━━━━━━━━

Jangan lupa hadir 15 menit sebelum jadwal ya! 😊

_Prime Wellness - Your Trusted Wellness Partner_`;

    case "invoice":
      return `Halo ${data.patientName}! 👋

🧾 *Invoice Telah Diterbitkan*
━━━━━━━━━━━━━━━━━━━
📄 Nomor Invoice: *${data.invoiceNumber}*
🏥 Layanan: ${data.serviceName}
💰 Total: *${data.total}*
━━━━━━━━━━━━━━━━━━━

Silakan melakukan pembayaran di klinik atau hubungi kami.

_Prime Wellness - Your Trusted Wellness Partner_`;

    default:
      return "Notifikasi dari Prime Wellness";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone, type, data } = await req.json();

    if (!phone || !type) {
      return NextResponse.json({ error: "phone and type are required" }, { status: 400 });
    }

    const message = buildMessage(type as NotifType, data || {});

    if (!WA_API_KEY) {
      console.log("[WhatsApp] No API key configured, skipping send");
      return NextResponse.json({ success: true, skipped: true });
    }

    const response = await fetch(WA_API_URL, {
      method: "POST",
      headers: {
        "Authorization": WA_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: phone,
        message,
        countryCode: "62",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[WhatsApp] Send failed:", result);
      return NextResponse.json({ error: "Failed to send WhatsApp" }, { status: 500 });
    }

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("[WhatsApp] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
