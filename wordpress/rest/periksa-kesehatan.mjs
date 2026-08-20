/**
 * Snapshot kesehatan WordPress — dipakai sebelum dan sesudah pekerjaan
 * berisiko (update core, pemasangan plugin) supaya regresi kelihatan
 * sebagai selisih angka, bukan firasat.
 *
 *   node wordpress/rest/periksa-kesehatan.mjs
 *   node wordpress/rest/periksa-kesehatan.mjs --banding sebelum.json sesudah.json
 *
 * Mode pertama menulis wordpress/rest/kesehatan-<waktu>.json (di-commit
 * sebagai jejak audit). Mode kedua membandingkan dua snapshot dan keluar
 * dengan kode 1 bila ada regresi.
 *
 * Murni baca: endpoint tgr/v1 diuji TANPA secret dan justru diharapkan
 * menolak (401/403) — 404 berarti mu-plugin tidak termuat.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { wp, AKAR_API, AGEN_HTTP } from "./wp.mjs";

const DI_SINI = dirname(fileURLToPath(import.meta.url));

/** Penerima webhook di Vercel; tanpa secret harus menjawab 401. */
const URL_PENERIMA_WEBHOOK =
  "https://the-global-review-website.vercel.app/api/revalidate";

/* ── Mode banding ──────────────────────────────────────────────────── */

const argumen = process.argv.slice(2);
if (argumen[0] === "--banding") {
  const [, jalurA, jalurB] = argumen;
  if (!jalurA || !jalurB) {
    console.error("Pakai: --banding <sebelum.json> <sesudah.json>");
    process.exit(1);
  }
  const a = JSON.parse(readFileSync(jalurA, "utf8"));
  const b = JSON.parse(readFileSync(jalurB, "utf8"));
  let regresi = 0;

  console.log(`\n═══ Banding snapshot ═══`);
  console.log(`sebelum : ${a.waktu} (core ${a.versiCore})`);
  console.log(`sesudah : ${b.waktu} (core ${b.versiCore})`);

  for (const kunci of new Set([
    ...Object.keys(a.koleksi ?? {}),
    ...Object.keys(b.koleksi ?? {}),
  ])) {
    const dulu = a.koleksi?.[kunci];
    const kini = b.koleksi?.[kunci];
    if (dulu === kini) continue;
    // Bertambah wajar (redaksi terus menulis); berkurang atau hilang = curiga.
    const buruk = kini === undefined || kini === null || (dulu ?? 0) > (kini ?? 0);
    if (buruk) regresi++;
    console.log(`  koleksi.${kunci}: ${dulu} → ${kini}${buruk ? "  ⚠ REGRESI" : ""}`);
  }

  const wajib = [
    ["auth.ok", a.auth?.ok, b.auth?.ok, (v) => v === true],
    ["contohArtikel.polaLink", a.contohArtikel?.polaLink, b.contohArtikel?.polaLink, (v) => v === true],
    ["contohArtikel.adaYoast", a.contohArtikel?.adaYoast, b.contohArtikel?.adaYoast, (v) => v === true],
    ["tgr.vote", a.tgr?.vote, b.tgr?.vote, (v) => v === 401 || v === 403],
    ["tgr.subscribe", a.tgr?.subscribe, b.tgr?.subscribe, (v) => v === 401 || v === 403],
    ["namespace tgr/v1", a.namespaces?.includes("tgr/v1"), b.namespaces?.includes("tgr/v1"), (v) => v === true],
  ];
  for (const [nama, dulu, kini, sah] of wajib) {
    if (!sah(kini)) {
      regresi++;
      console.log(`  ${nama}: ${dulu} → ${kini}  ⚠ REGRESI`);
    }
  }

  console.log(regresi ? `\n${regresi} regresi ditemukan.` : "\nTidak ada regresi.");
  process.exit(regresi ? 1 : 0);
}

/* ── Pemeriksaan ───────────────────────────────────────────────────── */

/** fetch mentah ber-UA sopan (WAF menolak curl/*), tanpa lempar. */
async function coba(url, opsi = {}) {
  try {
    const res = await fetch(url, {
      ...opsi,
      headers: { "User-Agent": AGEN_HTTP, ...(opsi.headers ?? {}) },
      signal: AbortSignal.timeout(20000),
    });
    return res;
  } catch (err) {
    return { status: 0, galat: err instanceof Error ? err.message : String(err) };
  }
}

async function hitungKoleksi() {
  const koleksi = {};
  const daftar = [
    ["posts", "/posts"],
    ["pages", "/pages"],
    ["categories", "/categories"],
    ["tags", "/tags"],
    ["media", "/media"],
    ["users", "/users"],
    ["podcasts", "/podcasts"],
    ["albums", "/albums"],
    ["polls", "/polls"],
    ["orang", "/orang"],
  ];
  for (const [nama, jalur] of daftar) {
    try {
      const { total } = await wp(jalur, { query: { per_page: 1, _fields: "id" } });
      koleksi[nama] = total;
    } catch (err) {
      // /orang baru ada setelah tgr-headless v3.0 diunggah — kegagalan
      // dicatat apa adanya, bukan disembunyikan.
      koleksi[nama] = null;
      console.error(`  ! ${nama}: ${err instanceof Error ? err.message : err}`);
    }
  }
  return koleksi;
}

async function contohArtikel() {
  const { data } = await wp("/posts", {
    query: { per_page: 1, _fields: "id,slug,link,yoast_head_json,featured_media" },
  });
  const pos = data[0];
  if (!pos) return null;
  return {
    id: pos.id,
    slug: pos.slug,
    polaLink: /^https:\/\/[^/]+\/[^/]+\/$/.test(pos.link ?? ""),
    adaYoast: Boolean(pos.yoast_head_json),
    adaGambar: Boolean(pos.featured_media),
  };
}

async function ujiAuth() {
  try {
    const { data } = await wp("/users/me", { query: { context: "edit", _fields: "name,slug" } });
    return { ok: true, user: data?.slug ?? data?.name ?? "?" };
  } catch (err) {
    return { ok: false, galat: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * POST tanpa secret ke endpoint tgr — 401/403 = hidup dan terkunci.
 * Parameter wajib diisi seadanya: body kosong ditolak validator argumen
 * (400) SEBELUM permission_callback berjalan, jadi tidak membuktikan
 * apa-apa soal secret. Dengan argumen lengkap, penolakan 401 benar-benar
 * datang dari pemeriksaan secret — dan tidak ada yang tersimpan.
 */
async function ujiEndpointTgr() {
  const contoh = {
    vote: { poll: 1, opsi: "probe" },
    subscribe: { email: "probe@example.com" },
    contact: { nama: "probe", email: "probe@example.com", pesan: "probe" },
  };
  const hasil = {};
  for (const [nama, body] of Object.entries(contoh)) {
    const res = await coba(`${AKAR_API}/tgr/v1/${nama}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    hasil[nama] = res.status;
  }
  return hasil;
}

async function ujiNamespace() {
  const res = await coba(`${AKAR_API}/`);
  if (!res.ok) return [];
  const isi = await res.json().catch(() => null);
  return isi?.namespaces ?? [];
}

/** Versi core dari HTML beranda — satu-satunya cara tanpa akses admin. */
async function versiCore() {
  const beranda = AKAR_API.replace(/\/wp-json$/, "");
  const res = await coba(beranda);
  if (!res.ok) return null;
  const html = await res.text();
  const cocok = html.match(/wp-emoji-release\.min\.js\?ver=([\d.]+)/);
  return cocok ? cocok[1] : null;
}

async function ujiPenerimaWebhook() {
  const res = await coba(URL_PENERIMA_WEBHOOK, { method: "POST", body: "{}" });
  return res.status;
}

console.log(`\n═══ Snapshot kesehatan WordPress ═══`);
console.log(`akar REST : ${AKAR_API}`);

const snapshot = {
  waktu: new Date().toISOString(),
  versiCore: await versiCore(),
  koleksi: await hitungKoleksi(),
  contohArtikel: await contohArtikel(),
  auth: await ujiAuth(),
  tgr: await ujiEndpointTgr(),
  namespaces: await ujiNamespace(),
  webhookVercel: await ujiPenerimaWebhook(),
};

const stempel = snapshot.waktu.replace(/[-:]/g, "").slice(0, 13);
const jalurKeluar = join(DI_SINI, `kesehatan-${stempel}.json`);
writeFileSync(jalurKeluar, JSON.stringify(snapshot, null, 2) + "\n");

console.log(JSON.stringify(snapshot, null, 2));
console.log(`\ntersimpan: ${jalurKeluar}`);

// Peringatan dini pada snapshot tunggal (tanpa banding).
const peringatan = [];
if (!snapshot.auth.ok) peringatan.push("Application Password tidak lolos autentikasi");
for (const [nama, kode] of Object.entries(snapshot.tgr)) {
  if (kode === 404) peringatan.push(`tgr/v1/${nama} → 404 (mu-plugin belum memuat endpoint ini)`);
  else if (kode !== 401 && kode !== 403) peringatan.push(`tgr/v1/${nama} → ${kode} (harapan 401/403)`);
}
if (!snapshot.namespaces.includes("tgr/v1")) peringatan.push("namespace tgr/v1 hilang");
if (snapshot.webhookVercel !== 401) {
  peringatan.push(`penerima webhook Vercel menjawab ${snapshot.webhookVercel} (harapan 401)`);
}
if (peringatan.length) {
  console.log("\n⚠ Perhatian:");
  for (const p of peringatan) console.log(`  - ${p}`);
}
