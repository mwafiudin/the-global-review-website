/**
 * Pindahkan pengurus GFI dan masthead Redaksi dari kode ke WordPress
 * (CPT tgr_orang, mu-plugin ≥3.0).
 *
 *   node --experimental-strip-types wordpress/rest/impor-orang.mjs
 *   APPLY=1 node --experimental-strip-types wordpress/rest/impor-orang.mjs
 *
 * Sebelum ini halaman /pengurus-gfi dan masthead /redaksi tertulis di
 * src/data/pages dan tidak bisa disunting redaksi. Skrip ini mengisi
 * wp-admin dengan konten yang sama persis — termasuk foto yang sekarang
 * dipakai (dua potret asli + placeholder stok) supaya tampilan tidak
 * berubah sehari pun; redaksi tinggal mengganti potretnya di wp-admin.
 *
 * Aman dijalankan berulang: profil dicari per slug (ber-prefiks kelompok,
 * karena Hendrajit & Harri ada di dua kelompok sekaligus); yang sudah ada
 * hanya diselaraskan metanya, foto tidak diunggah dua kali.
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, basename } from "node:path";
import { wp, unggah, TERAPKAN, judul } from "./wp.mjs";

const AKAR = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { pengurus } = await import(
  pathToFileURL(join(AKAR, "src", "data", "pages", "pengurus-gfi.ts")).href
);
const { redaksiCopy } = await import(
  pathToFileURL(join(AKAR, "src", "data", "pages", "redaksi.ts")).href
);

judul("Impor Pengurus & Redaksi");

// CPT baru ada sejak tgr-headless v3.0 — 404 berarti belum diunggah.
try {
  await wp("/orang", { query: { per_page: 1, _fields: "id" } });
} catch (err) {
  console.error(
    "\nCPT tgr_orang belum terdaftar di WordPress.\n" +
      "Unggah tgr-headless.php v3.0 ke wp-content/mu-plugins/ dulu, lalu " +
      "jalankan skrip ini lagi.\n" +
      `(${err instanceof Error ? err.message : err})`
  );
  process.exit(1);
}

const slugkan = (teks) =>
  teks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Rencana per orang: satu pos per (kelompok, nama). */
const rencana = [
  ...pengurus.map((p, i) => ({
    kelompok: "pengurus",
    slug: `pengurus-${slugkan(p.nama)}`,
    nama: p.nama,
    urutan: i + 1,
    foto: p.foto, // path di public/
    meta: {
      tgr_kelompok: "pengurus",
      tgr_jabatan: p.teks.id.jabatan,
      tgr_jabatan_en: p.teks.en.jabatan,
      tgr_bio: p.teks.id.bio,
      tgr_bio_en: p.teks.en.bio,
    },
  })),
  ...redaksiCopy.id.masthead.map((m, i) => ({
    kelompok: "redaksi",
    slug: `redaksi-${slugkan(m.nama)}`,
    nama: m.nama,
    urutan: i + 1,
    foto: null,
    meta: {
      tgr_kelompok: "redaksi",
      tgr_jabatan: m.peran,
      tgr_jabatan_en: redaksiCopy.en.masthead[i]?.peran ?? m.peran,
      tgr_bio: "",
      tgr_bio_en: "",
    },
  })),
];

/* ── Cek yang sudah ada ────────────────────────────────────────────── */

const { data: sudahAda } = await wp("/orang", {
  query: { per_page: 100, status: "publish,draft,pending", _fields: "id,slug" },
});
const idPerSlug = new Map(sudahAda.map((o) => [o.slug, o.id]));

const akanDibuat = rencana.filter((r) => !idPerSlug.has(r.slug));
console.log(`\nsudah ada    : ${rencana.length - akanDibuat.length} dari ${rencana.length} (metanya tetap diselaraskan)`);
console.log(`akan dibuat  : ${akanDibuat.length}`);
for (const r of akanDibuat) {
  console.log(`  • [${r.kelompok}] ${r.nama} (urutan ${r.urutan})` + (r.foto ? ` · foto ${basename(r.foto)}` : ""));
}

if (!TERAPKAN) {
  console.log("\nMode tinjauan. Jalankan ulang dengan APPLY=1 untuk menerapkan.");
  process.exit(0);
}

/* ── Foto: unggah sekali per berkas (beberapa orang berbagi placeholder) ── */

const idFotoPerBerkas = new Map();

async function idFoto(jalurFoto) {
  if (!jalurFoto) return 0;
  const nama = basename(jalurFoto);
  if (idFotoPerBerkas.has(nama)) return idFotoPerBerkas.get(nama);

  // Sudah pernah diunggah pada run sebelumnya? Cocokkan judul lampiran
  // (WordPress memakai nama berkas tanpa ekstensi sebagai judul).
  const tanpaEkstensi = nama.replace(/\.[^.]+$/, "");
  const { data: kandidat } = await wp("/media", {
    query: { search: tanpaEkstensi, per_page: 10, _fields: "id,title" },
  });
  const cocok = kandidat.find((m) => m.title?.rendered === tanpaEkstensi);
  if (cocok) {
    idFotoPerBerkas.set(nama, cocok.id);
    return cocok.id;
  }

  const berkas = await readFile(join(AKAR, "public", jalurFoto));
  const lampiran = await unggah(nama, berkas);
  console.log(`  foto ${nama} → id ${lampiran.id}`);
  idFotoPerBerkas.set(nama, lampiran.id);
  return lampiran.id;
}

/* ── Buat / selaraskan ─────────────────────────────────────────────── */

let dibuat = 0;
let diselaraskan = 0;
for (const r of rencana) {
  const fotoId = await idFoto(r.foto);
  const ada = idPerSlug.get(r.slug);

  if (ada) {
    await wp(`/orang/${ada}`, {
      metode: "POST",
      data: {
        menu_order: r.urutan,
        ...(fotoId ? { featured_media: fotoId } : {}),
        meta: r.meta,
      },
    });
    diselaraskan++;
    continue;
  }

  const { data: pos } = await wp("/orang", {
    metode: "POST",
    data: {
      title: r.nama,
      slug: r.slug,
      status: "publish",
      menu_order: r.urutan,
      ...(fotoId ? { featured_media: fotoId } : {}),
      meta: r.meta,
    },
  });
  const tanda = pos.slug === r.slug ? "" : `  ⚠ slug berubah jadi ${pos.slug}`;
  console.log(`  [${r.kelompok}] ${r.nama} → id ${pos.id}${tanda}`);
  dibuat++;
}

console.log(`\nselesai: ${dibuat} profil dibuat, ${diselaraskan} diselaraskan.`);
console.log(
  "Cek wp-admin → Pengurus & Redaksi: urutan lewat Atribut → Urutan, " +
    "potret placeholder tinggal diganti dari kotak Gambar Unggulan."
);
