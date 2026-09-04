/**
 * Selaraskan profil Pengurus & Redaksi dari repo ke WordPress lewat
 * endpoint tgr/v1/orang.
 *
 *   node --experimental-strip-types --no-warnings wordpress/rest/kirim-orang.mjs
 *   APPLY=1 node --experimental-strip-types --no-warnings wordpress/rest/kirim-orang.mjs
 *
 * Kembaran impor-orang.mjs yang tidak memakai Application Password. Hosting
 * ini membuang header Authorization sebelum PHP melihatnya, sehingga REST
 * bawaan WordPress selalu menganggap permintaannya anonim — kredensial yang
 * sengaja dibuat salah menghasilkan jawaban yang sama persis dengan tanpa
 * kredensial sama sekali. Endpoint tgr/v1 memakai rahasia bersama lewat
 * header, jalur yang sudah terbukti lolos di host ini.
 *
 * Aman dijalankan berulang: profil dicari per slug, potret hanya diunduh
 * sekali per berkas.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const AKAR = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TERAPKAN = process.env.APPLY === "1";

/** User-Agent apa pun asal bukan curl/*: WAF host menolaknya dengan 406. */
const AGEN = "TGR-Admin/1.0 (+https://theglobal-review.com)";

function bacaEnv() {
  const env = {};
  for (const baris of readFileSync(join(AKAR, ".env.local"), "utf8").split(/\r?\n/)) {
    if (!baris.includes("=") || baris.trim().startsWith("#")) continue;
    const i = baris.indexOf("=");
    env[baris.slice(0, i).trim()] = baris.slice(i + 1).trim();
  }
  return env;
}

// process.env didahulukan supaya nilainya bisa diberikan sekali jalan tanpa
// menulis rahasia ke berkas, mis. saat menguji dari mesin lain.
const env = bacaEnv();
const BASE = (process.env.WP_API_URL || env.WP_API_URL || "").replace(/\/$/, "");
const SECRET = process.env.REVALIDATE_SECRET || env.REVALIDATE_SECRET || "";
if (!BASE) throw new Error("WP_API_URL belum diatur di .env.local");
if (!SECRET) {
  throw new Error(
    "REVALIDATE_SECRET belum diatur di .env.local. Salin nilai konstanta " +
      "TGR_REVALIDATE_SECRET dari wp-config.php di server."
  );
}

const { pengurus } = await import(
  pathToFileURL(join(AKAR, "src", "data", "pages", "pengurus-gfi.ts")).href
);
const { redaksiCopy } = await import(
  pathToFileURL(join(AKAR, "src", "data", "pages", "redaksi.ts")).href
);
const { site } = await import(pathToFileURL(join(AKAR, "src", "data", "site.ts")).href);

const slugkan = (teks) =>
  teks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Potret dirujuk lewat URL publik, bukan diunggah sebagai berkas: WordPress
 * yang mengunduhnya sendiri. Satu permintaan HTTP lebih sederhana daripada
 * multipart, dan berkasnya memang sudah tayang di domain kita.
 */
const profil = [
  ...pengurus.map((p, i) => ({
    slug: `pengurus-${slugkan(p.nama)}`,
    nama: p.nama,
    urutan: i + 1,
    kelompok: "pengurus",
    jabatan: p.teks.id.jabatan,
    jabatan_en: p.teks.en.jabatan,
    bio: p.teks.id.bio,
    bio_en: p.teks.en.bio,
    foto_url: site.url + p.foto,
  })),
  ...redaksiCopy.id.masthead.map((m, i) => ({
    slug: `redaksi-${slugkan(m.nama)}`,
    nama: m.nama,
    urutan: i + 1,
    kelompok: "redaksi",
    jabatan: m.peran,
    jabatan_en: redaksiCopy.en.masthead[i]?.peran ?? m.peran,
    bio: "",
    bio_en: "",
  })),
];

console.log("\n═══ Selaraskan Pengurus & Redaksi ═══");
console.log(TERAPKAN ? "MODE: TERAPKAN" : "MODE: TINJAUAN (tidak ada perubahan)");
console.log(`\nprofil disiapkan: ${profil.length}\n`);
for (const p of profil) {
  const tanda = p.foto_url ? "foto" : "    ";
  console.log(
    `  ${String(p.urutan).padStart(2)} [${p.kelompok.padEnd(8)}] ${tanda}  ${p.nama.padEnd(22)} ${p.jabatan.slice(0, 46)}`
  );
}

if (!TERAPKAN) {
  console.log("\nJalankan ulang dengan APPLY=1 untuk mengirim.");
  process.exit(0);
}

const res = await fetch(`${BASE}/wp-json/tgr/v1/orang`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "User-Agent": AGEN,
    "x-tgr-secret": SECRET,
  },
  body: JSON.stringify({ profil }),
  // Mengunduh enam potret dan membuat variannya butuh waktu di shared hosting.
  signal: AbortSignal.timeout(180000),
});

const teks = await res.text();
if (!res.ok) {
  console.error(`\nGAGAL: HTTP ${res.status}\n${teks.slice(0, 600)}`);
  process.exit(1);
}

const hasil = JSON.parse(teks);
console.log(`\nselesai: ${hasil.jumlah} profil diproses\n`);
for (const h of hasil.hasil) {
  console.log(
    `  ${h.status.padEnd(13)} ${String(h.id).padEnd(7)} foto=${String(h.foto || 0).padEnd(7)} ${h.slug}`
  );
}
