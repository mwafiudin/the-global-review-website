/**
 * Pindahkan empat ulasan Bedah Buku dari kode ke WordPress.
 *
 *   node --experimental-strip-types wordpress/rest/impor-buku.mjs
 *   APPLY=1 node --experimental-strip-types wordpress/rest/impor-buku.mjs
 *
 * Sebelum ini halaman /bedah-buku menampilkan empat ulasan yang tertulis di
 * `src/data/books.ts` dan tidak bisa disunting redaksi, sementara kategori
 * Bedah Buku di wp-admin berisi puluhan ulasan lain yang justru tidak muncul
 * dari menu. Skrip ini menyatukan keduanya di WordPress.
 *
 * Berkas `src/data/books.ts` sengaja dipertahankan: ia tetap jadi cadangan
 * bila WordPress tak terjangkau (lihat src/lib/wp/books.ts).
 *
 * Aman dijalankan berulang: slug yang sudah ada di WordPress dilewati, tidak
 * ditimpa dan tidak diduplikasi.
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, basename } from "node:path";
import { wp, unggah, TERAPKAN, judul } from "./wp.mjs";

const AKAR = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { books } = await import(
  pathToFileURL(join(AKAR, "src", "data", "books.ts")).href
);

/** Redaksi, bukan penulis bukunya — Hendrajit menulis tiga dari empat buku. */
const PENULIS_ULASAN = 1;

/**
 * Tanggal commit prototype, saat naskah ulasan ini ditulis untuk situs baru.
 * Bukan hari ini: menerbitkannya bertanggal sekarang akan mendorongnya ke
 * puncak beranda dan menggeser berita yang sebenarnya baru.
 */
const TANGGAL = "2026-07-25T09:00:00";

const html = (paragraf) =>
  paragraf.map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`).join("\n\n");

judul("Impor Bedah Buku");

const { data: kategori } = await wp("/categories", {
  query: { slug: "bedah-buku", _fields: "id,name" },
});
if (kategori.length === 0) {
  console.error("Kategori 'bedah-buku' tidak ditemukan di WordPress.");
  process.exit(1);
}
const idKategori = kategori[0].id;
console.log(`kategori     : ${kategori[0].name} (id ${idKategori})`);

/**
 * Meta yang belum terdaftar di WordPress diabaikan diam-diam oleh REST —
 * tidak ada galat, nilainya hanya hilang. Dua field ini baru ada sejak
 * mu-plugin v2.3, jadi keberadaannya diperiksa dulu, bukan diasumsikan.
 */
const { data: sampel } = await wp("/posts", {
  query: { per_page: 1, _fields: "meta" },
});
const metaTersedia = Object.keys(sampel[0]?.meta ?? {});
const belumAda = ["tgr_buku_penulis_lengkap", "tgr_buku_podcast"].filter(
  (k) => !metaTersedia.includes(k)
);
if (belumAda.length) {
  console.log(
    `\n⚠ mu-plugin belum v2.3 — ${belumAda.join(", ")} belum terdaftar.\n` +
      "  Impor tetap jalan, tapi kedua nilai itu tidak tersimpan.\n" +
      "  Unggah tgr-headless.php lalu jalankan skrip ini sekali lagi\n" +
      "  untuk melengkapinya (tulisan yang sudah ada tidak diduplikasi)."
  );
}

const adaSlug = new Map();
const rencana = [];
for (const buku of books) {
  const { data: ada } = await wp("/posts", {
    query: { slug: buku.slug, status: "publish,draft,pending", _fields: "id" },
  });
  if (ada.length > 0) {
    adaSlug.set(buku.slug, ada[0].id);
    continue;
  }
  rencana.push(buku);
}

console.log(`\nakan dibuat  : ${rencana.length} dari ${books.length}`);
for (const b of rencana) {
  console.log(`  • ${b.judul}`);
  console.log(`    slug ${b.slug} · ${b.ulasan.length} paragraf · sampul ${basename(b.cover)}`);
}
if (adaSlug.size) {
  console.log(`sudah ada    : ${adaSlug.size} (metanya tetap diselaraskan)`);
  for (const [slug, id] of adaSlug) console.log(`  • ${slug} (id ${id})`);
}

if (!TERAPKAN) {
  console.log("\nMode tinjauan. Jalankan ulang dengan APPLY=1 untuk menerapkan.");
  process.exit(0);
}

for (const buku of rencana) {
  // Sampul diunggah lebih dulu: id-nya dipakai sebagai gambar unggulan
  // sekaligus meta tgr_buku_sampul, jadi tulisan ini juga punya gambar saat
  // tampil sebagai artikel biasa di /{slug}.
  const berkas = await readFile(join(AKAR, "public", buku.cover));
  const lampiran = await unggah(basename(buku.cover), berkas);
  console.log(`  sampul  ${basename(buku.cover)} → id ${lampiran.id}`);

  const { data: pos } = await wp("/posts", {
    metode: "POST",
    data: {
      title: buku.judul,
      slug: buku.slug,
      status: "publish",
      date: TANGGAL,
      author: PENULIS_ULASAN,
      categories: [idKategori],
      excerpt: buku.ringkasan,
      content: html(buku.ulasan),
      featured_media: lampiran.id,
      meta: {
        tgr_buku_judul: buku.judul,
        tgr_buku_penulis: buku.penulis,
        tgr_buku_penulis_lengkap: buku.penulisLengkap ?? "",
        tgr_buku_penerbit: buku.penerbit,
        tgr_buku_tahun: buku.tahun ?? "",
        tgr_buku_isbn: buku.isbn ?? "",
        tgr_buku_sampul: lampiran.id,
        tgr_buku_podcast: buku.podcastTerkait ?? "",
      },
    },
  });

  // Slug bisa bergeser bila WordPress menemukan bentrokan — kalau itu
  // terjadi, /bedah-buku/{slug} lama akan 404 dan harus segera ketahuan.
  const tanda = pos.slug === buku.slug ? "" : `  ⚠ slug berubah jadi ${pos.slug}`;
  console.log(`  tulisan id ${pos.id} · ${pos.slug}${tanda}`);
  adaSlug.set(pos.slug, pos.id);
}

/**
 * Selaraskan meta untuk keempatnya, termasuk yang sudah ada sejak jalan
 * sebelumnya. Inilah yang membuat skrip ini bisa dijalankan lagi setelah
 * mu-plugin diperbarui: field yang tadinya hilang terisi tanpa perlu
 * membuat ulang tulisannya.
 */
let dilengkapi = 0;
for (const buku of books) {
  const id = adaSlug.get(buku.slug);
  if (!id) continue;
  await wp(`/posts/${id}`, {
    metode: "POST",
    data: {
      meta: {
        tgr_buku_judul: buku.judul,
        tgr_buku_penulis: buku.penulis,
        tgr_buku_penulis_lengkap: buku.penulisLengkap ?? "",
        tgr_buku_penerbit: buku.penerbit,
        tgr_buku_tahun: buku.tahun ?? "",
        tgr_buku_isbn: buku.isbn ?? "",
        tgr_buku_podcast: buku.podcastTerkait ?? "",
      },
    },
  });
  dilengkapi++;
}

console.log(`\nselesai: ${rencana.length} ulasan dibuat, ${dilengkapi} meta diselaraskan.`);
if (belumAda.length) {
  console.log("Ingat: jalankan sekali lagi setelah tgr-headless.php v2.3 diunggah.");
}
