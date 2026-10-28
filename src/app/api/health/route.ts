/**
 * Health check untuk orkestrator (HEALTHCHECK Docker, Caddy, Railway):
 * menjawab "proses Node hidup dan bisa melayani request", tidak lebih.
 *
 * Sengaja tidak menyentuh WordPress. Health check yang ikut menunggu
 * cms.* membuat container sehat dinyatakan mati setiap kali host WP lambat
 * atau memblok egress (insiden 23 Okt 2026), lalu orkestrator me-restart
 * service dan mengosongkan cache ISR — padahal cache itulah yang membuat
 * situs tetap tayang selama WP bermasalah. Kesegaran konten dipantau
 * terpisah oleh scripts/pantau-artikel-terbaru.mjs.
 *
 * Balasannya tidak memuat versi, uptime, atau nama host: endpoint ini
 * publik, dan isi seperti itu hanya berguna bagi orang yang memetakan
 * server.
 */

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } }
  );
}
