#!/usr/bin/env node
/**
 * Pemeriksa sintetis: apakah tulisan terbaru di WordPress sudah tampil di
 * situs? Ini mengulang persis keluhan pembaca, dari luar, tanpa akses log.
 *
 * Insiden 23 Okt 2026: IP egress Railway diblok firewall host WP. Webhook
 * tetap 200 dan beranda lama tetap tersaji dari cache, jadi semua tampak
 * sehat — yang tahu pertama justru klien. Pemeriksaan ini gagal bila:
 *   1. halaman tulisan terbaru tidak 200 dalam batas waktu, atau
 *   2. tulisan itu sudah terbit lebih dari GRACE_MENIT tapi belum ada di beranda.
 *
 * Dipakai oleh .github/workflows/pantau-situs.yml. Lokal:
 *   node scripts/pantau-artikel-terbaru.mjs
 */

const SITE_URL = process.env.SITE_URL ?? "https://www.theglobal-review.com";
const WP_URL = process.env.WP_URL ?? "https://cms.theglobal-review.com";
const GRACE_MENIT = Number(process.env.GRACE_MENIT ?? 20);
// WAF host menjawab 406 untuk UA non-browser lalu memblok IP; UA ini sudah diterima.
const UA_WP = "TGR-Admin/1.0 (+https://theglobal-review.com)";
const UA_SITUS = "TGR-Pemantau/1.0 (+https://theglobal-review.com)";

/**
 * Menilai hasil pengamatan. Murni, supaya bisa diuji tanpa jaringan.
 * @returns {string[]} daftar masalah; kosong berarti sehat.
 */
export function nilai({ slug, terbitGmt, sekarang, statusArtikel, berandaHtml, graceMenit }) {
  const masalah = [];
  if (statusArtikel !== 200) {
    masalah.push(`Halaman /${slug} menjawab ${statusArtikel ?? "timeout"}, bukan 200.`);
  }
  const umurMenit = (sekarang - Date.parse(`${terbitGmt}Z`)) / 60000;
  if (umurMenit >= graceMenit && !berandaHtml.includes(slug)) {
    masalah.push(
      `Tulisan terbaru (${slug}) terbit ${Math.round(umurMenit)} menit lalu tapi belum ada di beranda.`
    );
  }
  return masalah;
}

async function ambil(url, ua, timeoutMs) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": ua },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "follow",
    });
    return { status: res.status, body: await res.text() };
  } catch {
    return { status: undefined, body: "" };
  }
}

async function main() {
  const wp = await ambil(
    `${WP_URL}/wp-json/wp/v2/posts?per_page=1&_fields=slug,date_gmt`,
    UA_WP,
    20000
  );
  if (wp.status !== 200) {
    // WP sendiri tak terjangkau dari runner: itu masalah lain (host down /
    // runner diblok), laporkan tapi jangan menuduh frontend.
    console.error(`WordPress REST menjawab ${wp.status ?? "timeout"} dari runner.`);
    process.exit(2);
  }
  const [post] = JSON.parse(wp.body);
  if (!post) {
    console.log("Belum ada tulisan terbit.");
    return;
  }

  const artikel = await ambil(`${SITE_URL}/${post.slug}`, UA_SITUS, 30000);
  // Sengaja tanpa kueri pembobol cache: yang diuji justru versi ter-cache
  // yang dilihat pembaca.
  const beranda = await ambil(`${SITE_URL}/`, UA_SITUS, 30000);

  const masalah = nilai({
    slug: post.slug,
    terbitGmt: post.date_gmt,
    sekarang: Date.now(),
    statusArtikel: artikel.status,
    berandaHtml: beranda.body,
    graceMenit: GRACE_MENIT,
  });

  if (masalah.length) {
    for (const m of masalah) console.error(m);
    process.exit(1);
  }
  console.log(`Sehat: /${post.slug} 200 dan ada di beranda.`);
}

// Hanya jalan bila dipanggil langsung, bukan saat diimpor tes.
if (process.argv[1]?.endsWith("pantau-artikel-terbaru.mjs")) {
  await main();
}
