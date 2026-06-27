import { type NextRequest } from "next/server";
import { getOAuth2Client } from "@/lib/google-calendar";

const html = (title: string, body: string, isError = false) => `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><title>${title}</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:640px;margin:60px auto;padding:0 24px;color:#1e293b}
  h1{font-size:1.4rem;margin-bottom:8px}
  p{color:#64748b;font-size:.95rem;margin:4px 0}
  pre{background:#f1f5f9;border-radius:8px;padding:16px;font-size:.85rem;overflow-x:auto;white-space:pre-wrap;word-break:break-all}
  .badge{display:inline-block;padding:4px 10px;border-radius:999px;font-size:.75rem;font-weight:600}
  .ok{background:#dcfce7;color:#166534}
  .err{background:#fee2e2;color:#991b1b}
  .step{background:#eff6ff;border-left:3px solid #3b82f6;padding:12px 16px;border-radius:0 8px 8px 0;margin:12px 0;font-size:.9rem}
  .step code{background:#dbeafe;padding:2px 6px;border-radius:4px;font-family:monospace}
</style>
</head>
<body>
<span class="badge ${isError ? "err" : "ok"}">${isError ? "Error" : "Sukses"}</span>
<h1>${title}</h1>
${body}
</body></html>`;

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return new Response(
      html("Otorisasi Gagal", `<p>Google menolak akses: <strong>${error ?? "kode tidak ditemukan"}</strong></p>`, true),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);

    if (!tokens.refresh_token) {
      return new Response(
        html(
          "Tidak ada Refresh Token",
          `<p>Google tidak mengembalikan refresh token. Ini terjadi jika akun sudah pernah memberi izin sebelumnya.</p>
          <div class="step">Buka <a href="/api/calendar/auth">Google OAuth</a> lagi setelah mencabut akses di <a href="https://myaccount.google.com/permissions" target="_blank">myaccount.google.com/permissions</a> agar Google mengembalikan refresh token baru.</div>`,
          true
        ),
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const steps = `
    <div class="step">
      <strong>1. Tambahkan ke <code>.env.local</code>:</strong><br/>
      <pre>GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</pre>
    </div>
    <div class="step">
      <strong>2. Tambahkan ke Vercel (Production):</strong><br/>
      <p>Di Vercel Dashboard → Settings → Environment Variables, tambahkan:</p>
      <pre>GOOGLE_REFRESH_TOKEN = ${tokens.refresh_token}</pre>
      <p>Lalu klik <strong>Redeploy</strong> di tab Deployments.</p>
    </div>
    <div class="step">
      <strong>3. Restart server lokal</strong> dengan <code>npm run dev</code> agar variabel baru aktif.
    </div>`;

    return new Response(
      html(
        "Google Calendar Terhubung!",
        `<p>Salin <strong>Refresh Token</strong> di bawah dan ikuti langkah-langkah berikut:</p>
        <pre>${tokens.refresh_token}</pre>
        ${steps}`
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (err) {
    return new Response(
      html("Token Exchange Gagal", `<pre>${String(err)}</pre>`, true),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
