/**
 * Pindahkan tulisan lama ke Tong Sampah WordPress.
 *
 * Arahan GFI: konten 2022 ke bawah diarsipkan terpisah (Google Drive) dan
 * tidak ditampilkan lagi. Frontend sudah menyembunyikannya lewat
 * WP_ARCHIVE_AFTER; skrip ini merapikan sisi WordPress-nya supaya redaksi
 * tidak lagi melihatnya di daftar kerja dan situs lama berhenti menyajikan.
 *
 * Tong Sampah, BUKAN hapus permanen: WordPress menyimpannya ±30 hari
 * sehingga masih bisa dipulihkan bila ternyata ada yang perlu ditarik lagi.
 *
 *   node wordpress/rest/arsipkan-lama.mjs             # tinjau saja
 *   APPLY=1 node wordpress/rest/arsipkan-lama.mjs     # jalankan
 *   BATAS=50 APPLY=1 node …                           # batasi jumlahnya
 */

import { wp, berkelompok, TERAPKAN, judul } from "./wp.mjs";

const SEBELUM = process.env.SEBELUM || "2023-01-01T00:00:00";
const BATAS = process.env.BATAS ? Number(process.env.BATAS) : Infinity;

judul(`Arsipkan tulisan terbit sebelum ${SEBELUM}`);

// Urutan sama persis dengan yang dipakai putaran kerja di bawah, supaya
// contoh yang ditampilkan memang tulisan yang akan disentuh lebih dulu.
const { data: contoh, total } = await wp("/posts", {
  query: {
    before: SEBELUM,
    status: "publish",
    per_page: 3,
    _fields: "id,date,title,link",
    orderby: "date",
    order: "asc",
  },
});

console.log(`\nTulisan terbit yang cocok: ${total}`);
if (total === 0) {
  console.log("Tidak ada yang perlu dikerjakan.");
  process.exit(0);
}

console.log("\nContoh yang akan dipindahkan:");
for (const pos of contoh) {
  console.log(`  ${pos.date.slice(0, 10)}  ${pos.title.rendered.slice(0, 70)}`);
}

if (!TERAPKAN) {
  console.log(
    `\nTinjauan selesai — tidak ada yang diubah.\n` +
      `Jalankan sungguhan:  APPLY=1 node wordpress/rest/arsipkan-lama.mjs`
  );
  process.exit(0);
}

/**
 * Tidak perlu menyimpan kemajuan: tulisan yang sudah masuk Tong Sampah
 * keluar sendiri dari kueri status=publish, jadi menjalankan ulang skrip
 * ini otomatis melanjutkan sisanya.
 */
let totalDipindah = 0;
for (;;) {
  const { data: batch } = await wp("/posts", {
    query: { before: SEBELUM, status: "publish", per_page: 100, _fields: "id", orderby: "date", order: "asc" },
  });
  if (batch.length === 0) break;

  const sisaJatah = BATAS - totalDipindah;
  if (sisaJatah <= 0) break;
  const kerjakan = batch.slice(0, sisaJatah);

  const { selesai, gagal } = await berkelompok(
    kerjakan,
    // Tanpa force=true → Tong Sampah, bukan hapus permanen.
    (pos) => wp(`/posts/${pos.id}`, { metode: "DELETE" }),
    { label: `total ${totalDipindah} + `, tiap: 30 }
  );
  totalDipindah += selesai;

  if (gagal > 0 && selesai === 0) {
    console.error("\nBerhenti: seluruh permintaan pada putaran ini gagal.");
    process.exit(1);
  }
  if (totalDipindah >= BATAS) break;
}

console.log(`\nSelesai. ${totalDipindah} tulisan dipindahkan ke Tong Sampah.`);
console.log("Pulihkan lewat wp-admin → Pos → Tong Sampah bila ada yang perlu ditarik kembali.");
