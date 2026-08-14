/**
 * Klien REST WordPress untuk pekerjaan administratif dari mesin lokal.
 *
 * Dipakai skrip di folder ini sebagai pengganti WP-CLI: hosting situs ini
 * shared tanpa SSH, jadi WP-CLI tidak bisa dijalankan sama sekali. REST
 * dengan Application Password menutup hampir seluruh kebutuhannya —
 * kategori, tulisan, media, tipe konten khusus, dan pengguna.
 *
 * Kredensial dibaca dari .env.local (tidak pernah masuk git):
 *   WP_API_URL, WP_APP_USER, WP_APP_PASSWORD
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const AKAR = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** User-Agent apa pun asal bukan curl/*: WAF host menolaknya dengan 406. */
const USER_AGENT = "TGR-Admin/1.0 (+https://the-global-review-website.vercel.app)";

/** Host ini membatasi burst — empat koneksi sudah terbukti aman di frontend. */
const MAKS_PARALEL = 3;
const JEDA_ULANG_MS = 900;
const BATAS_WAKTU_MS = 20000;

function bacaEnv() {
  let isi = "";
  try {
    isi = readFileSync(join(AKAR, ".env.local"), "utf8");
  } catch {
    throw new Error("Tidak menemukan .env.local di akar proyek.");
  }
  const env = {};
  for (const baris of isi.split(/\r?\n/)) {
    if (!baris.includes("=") || baris.trim().startsWith("#")) continue;
    const i = baris.indexOf("=");
    env[baris.slice(0, i).trim()] = baris.slice(i + 1).trim();
  }
  return env;
}

const env = bacaEnv();
const BASE = (env.WP_API_URL || "").replace(/\/$/, "");
if (!BASE) throw new Error("WP_API_URL belum diatur di .env.local");
if (!env.WP_APP_USER || !env.WP_APP_PASSWORD) {
  throw new Error(
    "WP_APP_USER / WP_APP_PASSWORD belum diatur di .env.local " +
      "(wp-admin → Pengguna → profil → Kata Sandi Aplikasi)."
  );
}
const AUTH =
  "Basic " +
  Buffer.from(`${env.WP_APP_USER}:${env.WP_APP_PASSWORD}`).toString("base64");

/* ── Semafor sederhana ─────────────────────────────────────────────── */

let terpakai = 0;
const antre = [];

function ambilSlot() {
  if (terpakai < MAKS_PARALEL) {
    terpakai++;
    return Promise.resolve();
  }
  return new Promise((lanjut) => antre.push(lanjut));
}

function lepasSlot() {
  const berikut = antre.shift();
  if (berikut) berikut();
  else terpakai--;
}

/* ── Permintaan ────────────────────────────────────────────────────── */

/**
 * Satu permintaan REST ber-autentikasi. Mengulang pada 429/5xx dengan jeda
 * menaik: host ini menjawab 503 bila diberondong, dan operasi massal
 * ribuan tulisan pasti menyentuh batas itu.
 */
export async function wp(jalur, { metode = "GET", data, query } = {}) {
  const url = new URL(`${BASE}/wp/v2${jalur}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  await ambilSlot();
  try {
    let galatTerakhir;
    for (let percobaan = 0; percobaan < 4; percobaan++) {
      if (percobaan > 0) {
        await new Promise((r) => setTimeout(r, JEDA_ULANG_MS * percobaan));
      }
      try {
        const res = await fetch(url, {
          method: metode,
          headers: {
            Authorization: AUTH,
            "User-Agent": USER_AGENT,
            ...(data ? { "Content-Type": "application/json" } : {}),
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: AbortSignal.timeout(BATAS_WAKTU_MS),
        });
        if (res.status === 429 || res.status >= 500) {
          galatTerakhir = new Error(`${res.status} untuk ${metode} ${jalur}`);
          continue;
        }
        const isi = await res.json().catch(() => null);
        if (!res.ok) {
          const pesan = isi && isi.message ? isi.message : res.status;
          throw new Error(`${metode} ${jalur} gagal: ${pesan}`);
        }
        return { data: isi, total: Number(res.headers.get("x-wp-total") || 0) };
      } catch (err) {
        if (err instanceof Error && err.message.includes("gagal:")) throw err;
        galatTerakhir = err instanceof Error ? err : new Error(String(err));
      }
    }
    throw galatTerakhir ?? new Error(`Gagal: ${metode} ${jalur}`);
  } finally {
    lepasSlot();
  }
}

/** Jalankan tugas berkelompok sambil melaporkan kemajuan. */
export async function berkelompok(daftar, kerjakan, { label = "", tiap = 50 } = {}) {
  let selesai = 0;
  let gagal = 0;
  const mulai = Date.now();

  for (let i = 0; i < daftar.length; i += MAKS_PARALEL) {
    const potongan = daftar.slice(i, i + MAKS_PARALEL);
    const hasil = await Promise.allSettled(potongan.map(kerjakan));
    for (const satu of hasil) {
      if (satu.status === "fulfilled") selesai++;
      else {
        gagal++;
        console.error(`  ! ${satu.reason?.message ?? satu.reason}`);
      }
    }
    if (selesai % tiap < MAKS_PARALEL || selesai + gagal === daftar.length) {
      const detik = Math.round((Date.now() - mulai) / 1000);
      const sisa = daftar.length - selesai - gagal;
      console.log(
        `  ${label}${selesai}/${daftar.length} selesai` +
          (gagal ? `, ${gagal} gagal` : "") +
          `, sisa ${sisa} (${detik} dtk)`
      );
    }
  }
  return { selesai, gagal };
}

/** Apakah dijalankan sungguhan, atau sekadar meninjau rencana. */
export const TERAPKAN = process.env.APPLY === "1";

export function judul(teks) {
  console.log(`\n═══ ${teks} ═══`);
  console.log(TERAPKAN ? "MODE: DIJALANKAN SUNGGUHAN" : "MODE: TINJAUAN (tidak ada perubahan)");
}
