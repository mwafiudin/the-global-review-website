/**
 * Isi meta halaman statis di WordPress dengan teks yang sekarang ada di
 * kode (mu-plugin ≥3.0, kotak "Isi Halaman — Situs Baru"), plus tandai
 * buku pilihan sidebar.
 *
 *   node --experimental-strip-types wordpress/rest/isi-halaman.mjs
 *   APPLY=1 node --experimental-strip-types wordpress/rest/isi-halaman.mjs
 *
 * Nilai seed identik dengan modul src/data/pages sehingga render sebelum
 * dan sesudah seed sama persis — yang berubah hanya siapa yang bisa
 * menyuntingnya. Aman dijalankan berulang: hanya field yang berbeda yang
 * dikirim ulang.
 *
 * PENTING: Laman dirujuk lewat ID (slug lama saling tertukar — lihat
 * tgr_halaman_konfig() di mu-plugin dan HALAMAN_ID di lib frontend).
 */

import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { wp, TERAPKAN, judul } from "./wp.mjs";

const AKAR = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const impor = (jalur) => import(pathToFileURL(join(AKAR, jalur)).href);

const { tentangTgrCopy } = await impor("src/data/pages/tentang-tgr.ts");
const { tentangGfiCopy } = await impor("src/data/pages/tentang-gfi.ts");
const { pengurusGfiCopy } = await impor("src/data/pages/pengurus-gfi.ts");
const { hubungiKamiCopy, alamatKantor, petaQuery } = await impor(
  "src/data/pages/hubungi-kami.ts"
);

const baris = (daftar) => daftar.join("\n");

/** Target meta per ID Laman — cermin tgr_halaman_field() di mu-plugin. */
const TARGET = {
  574: {
    rute: "/tentang-tgr",
    meta: {
      tgr_lead: tentangTgrCopy.id.lead,
      tgr_lead_en: tentangTgrCopy.en.lead,
      tgr_paragraf: baris(tentangTgrCopy.id.paragraphs),
      tgr_paragraf_en: baris(tentangTgrCopy.en.paragraphs),
    },
  },
  576: {
    rute: "/tentang-gfi",
    meta: {
      tgr_lead: tentangGfiCopy.id.lead,
      tgr_lead_en: tentangGfiCopy.en.lead,
      tgr_paragraf: baris(tentangGfiCopy.id.pembuka),
      tgr_paragraf_en: baris(tentangGfiCopy.en.pembuka),
      tgr_isu_judul: tentangGfiCopy.id.isuHeading,
      tgr_isu_judul_en: tentangGfiCopy.en.isuHeading,
      tgr_isu_intro: tentangGfiCopy.id.isuIntro,
      tgr_isu_intro_en: tentangGfiCopy.en.isuIntro,
      tgr_isu_butir: baris(tentangGfiCopy.id.isuPokok),
      tgr_isu_butir_en: baris(tentangGfiCopy.en.isuPokok),
      tgr_visi: tentangGfiCopy.id.visiQuote,
      tgr_visi_en: tentangGfiCopy.en.visiQuote,
      tgr_visi_label: tentangGfiCopy.id.visiCaption,
      tgr_visi_label_en: tentangGfiCopy.en.visiCaption,
      tgr_misi_butir: baris(tentangGfiCopy.id.misi),
      tgr_misi_butir_en: baris(tentangGfiCopy.en.misi),
      tgr_fokus_intro: tentangGfiCopy.id.fokusIntro,
      tgr_fokus_intro_en: tentangGfiCopy.en.fokusIntro,
      tgr_fokus_butir: baris(tentangGfiCopy.id.fokusKegiatan),
      tgr_fokus_butir_en: baris(tentangGfiCopy.en.fokusKegiatan),
      tgr_fokus_penutup: tentangGfiCopy.id.fokusPenutup,
      tgr_fokus_penutup_en: tentangGfiCopy.en.fokusPenutup,
    },
  },
  572: {
    rute: "/hubungi-kami",
    meta: {
      tgr_lead: hubungiKamiCopy.id.lead,
      tgr_lead_en: hubungiKamiCopy.en.lead,
      tgr_alamat: alamatKantor,
      tgr_jam: hubungiKamiCopy.id.jamTeks,
      tgr_jam_en: hubungiKamiCopy.en.jamTeks,
      tgr_peta_q: petaQuery,
    },
  },
  611: {
    rute: "/pengurus-gfi",
    meta: {
      tgr_lead: pengurusGfiCopy.id.lead,
      tgr_lead_en: pengurusGfiCopy.en.lead,
      tgr_paragraf: pengurusGfiCopy.id.pengantar,
      tgr_paragraf_en: pengurusGfiCopy.en.pengantar,
    },
  },
};

/** Buku yang dicentang sebagai kartu promo sidebar. */
const SLUG_BUKU_PILIHAN = "perang-asimetris-skema-penjajahan-gaya-baru";

judul("Isi Halaman Statis");

/* ── Diff per halaman ──────────────────────────────────────────────── */

const rencana = [];
for (const [id, { rute, meta }] of Object.entries(TARGET)) {
  const { data: laman } = await wp(`/pages/${id}`, {
    query: { _fields: "id,title,meta" },
  });
  const kini = laman.meta ?? {};

  // Meta yang belum terdaftar diabaikan REST diam-diam — pastikan dulu.
  if (!("tgr_lead" in kini)) {
    console.error(
      `\nMeta halaman belum terdaftar di Laman ${id} — unggah ` +
        "tgr-headless.php v3.0 dulu, lalu jalankan skrip ini lagi."
    );
    process.exit(1);
  }

  const beda = Object.entries(meta).filter(([k, v]) => (kini[k] ?? "") !== v);
  console.log(
    `\nLaman ${id} (${laman.title?.rendered ?? "?"}) → ${rute}: ` +
      (beda.length ? `${beda.length} field akan diisi` : "sudah sesuai")
  );
  for (const [k] of beda) console.log(`  • ${k}`);
  if (beda.length) rencana.push({ id, meta: Object.fromEntries(beda) });
}

/* ── Buku pilihan ──────────────────────────────────────────────────── */

const { data: buku } = await wp("/posts", {
  query: { slug: SLUG_BUKU_PILIHAN, _fields: "id,slug,meta" },
});
let bukuPerluDitandai = false;
if (buku.length === 0) {
  console.log(`\n⚠ Tulisan ${SLUG_BUKU_PILIHAN} tidak ditemukan — buku pilihan dilewati.`);
} else {
  bukuPerluDitandai = buku[0].meta?.tgr_buku_unggulan !== "1";
  console.log(
    `\nBuku pilihan sidebar: ${SLUG_BUKU_PILIHAN}` +
      (bukuPerluDitandai ? " → akan ditandai" : " → sudah ditandai")
  );
}

if (!TERAPKAN) {
  console.log("\nMode tinjauan. Jalankan ulang dengan APPLY=1 untuk menerapkan.");
  process.exit(0);
}

/* ── Terapkan ──────────────────────────────────────────────────────── */

for (const { id, meta } of rencana) {
  await wp(`/pages/${id}`, { metode: "POST", data: { meta } });
  console.log(`  Laman ${id}: ${Object.keys(meta).length} field terisi`);
}
if (bukuPerluDitandai) {
  await wp(`/posts/${buku[0].id}`, {
    metode: "POST",
    data: { meta: { tgr_buku_unggulan: "1" } },
  });
  console.log(`  Buku pilihan ditandai (id ${buku[0].id})`);
}

console.log("\nselesai. Cek kotak \"Isi Halaman — Situs Baru\" di keempat Laman.");
