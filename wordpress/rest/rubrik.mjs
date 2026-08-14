/**
 * Tata ulang kategori WordPress agar sama dengan rubrikasi situs baru.
 * Pengganti wordpress/cli/04-rubrik.sh — hosting ini tanpa SSH, jadi
 * WP-CLI tidak bisa dijalankan sama sekali.
 *
 *   node wordpress/rest/rubrik.mjs            # tinjau rencana saja
 *   APPLY=1 node wordpress/rest/rubrik.mjs    # jalankan sungguhan
 *
 * WAJIB backup penuh (cPanel Backup Wizard) sebelum APPLY.
 *
 * Empat jenis tindakan, diurutkan dari yang paling aman:
 *   BUAT    — kategori baru yang belum ada.
 *   GANTI   — ubah nama/slug. NOL artikel disentuh: term-nya sama, hanya
 *             labelnya berganti, jadi seluruh kaitan tulisan tetap utuh.
 *   INDUK   — ubah hierarki. Juga nol artikel.
 *   GABUNG  — pindahkan tulisan ke kategori tujuan lalu hapus kategori
 *             asal. Ini SATU-SATUNYA yang mengubah kategori yang melekat
 *             pada tulisan, dan satu-satunya cara memensiunkan kategori
 *             tanpa membuat isinya yatim.
 *
 * Hanya tulisan berstatus terbit yang dipindahkan. Yang sudah di Tong
 * Sampah adalah arsip 2022 ke bawah yang memang tidak ditampilkan lagi;
 * jumlahnya dilaporkan supaya keputusan menghapus kategori asal diambil
 * dengan mata terbuka.
 */

import { wp, berkelompok, TERAPKAN, judul } from "./wp.mjs";

/** slug baru → nama tampilan; dibuat bila belum ada. */
const BUAT = [
  ["politik-keamanan", "Politik-Keamanan", null],
  ["asia-timur", "Asia Timur", "internasional"],
  ["asia-selatan", "Asia Selatan", "internasional"],
  ["asia-tengah", "Asia Tengah", "internasional"],
  ["australia", "Australia", "internasional"],
];

/** [slug lama, slug baru, nama baru] */
const GANTI = [
  ["analisis", "analisis", "Analisis"],
  ["internasional", "internasional", "Internasional"],
  ["geopolitik", "geopolitik", "Geopolitik"],
  ["ekonomi-bisnis", "ekonomi-bisnis", "Ekonomi & Bisnis"],
  ["hukum", "hukum", "Hukum"],
  ["iptek", "sains-teknologi", "Sains & Teknologi"],
  ["lingkungan-hidup", "lingkungan-hidup", "Lingkungan Hidup"],
  ["kesehatan", "kesehatan", "Kesehatan"],
  ["sorot-tokoh", "sorot-tokoh", "Sorot Tokoh"],
  ["bedah-buku", "bedah-buku", "Bedah Buku"],
  ["media", "media", "Media"],
  ["asean", "asia-tenggara", "Asia Tenggara"],
  ["komentar-pembaca", "komentar-pembaca", "Komentar Pembaca"],
  // Keputusan redaksi atas kategori besar tanpa padanan: yang terbesar
  // diganti nama (nol artikel disentuh), yang kecil digabung ke sana.
  ["sosial-budaya", "sosial", "Sosial"],
  ["khazanah", "budaya", "Budaya"],
  ["sejarah", "features", "Features"],
];

/** [slug anak, slug induk] — induk null berarti naik ke tingkat teratas. */
const INDUK = [
  ["militer", "politik-keamanan"],
  ["intelijen", "politik-keamanan"],
  ["kejahatan-transnasional", "politik-keamanan"],
  ["diplomasi", null],
  // khazanah dulunya induk dari ketiganya; setelah ia berganti nama jadi
  // Budaya, ketiganya ikut jadi anak Budaya. Di situs keempatnya rubrik
  // setingkat, jadi dinaikkan kembali.
  ["sosial", null],
  ["features", null],
  ["media", null],
];

/** [slug asal, slug tujuan] — tulisan dipindahkan, asal dihapus. */
const GABUNG = [
  ["politik", "politik-keamanan"],
  ["hankam", "politik-keamanan"],
  ["geopolitik-militer", "geopolitik"],
  ["kepentingan-nasional", "analisis"],
  ["strategi-global", "geopolitik"],
  ["nusantara", "sosial"],
  ["pendidikan", "sosial"],
  ["wawancara", "features"],
];

judul("Penataan rubrik WordPress");

/** Kategori dimuat sekali, lalu peta di memori diperbarui seiring jalan. */
async function muatKategori() {
  const { data } = await wp("/categories", {
    query: { per_page: 100, _fields: "id,slug,name,parent,count" },
  });
  return new Map(data.map((c) => [c.slug, c]));
}

let kategori = await muatKategori();
const cari = (slug) => kategori.get(slug);

/** Jumlah tulisan per status untuk sebuah kategori. */
async function hitung(id, status) {
  const { total } = await wp("/posts", {
    query: { categories: id, status, per_page: 1, _fields: "id" },
  });
  return total;
}

/* ── 1. BUAT ───────────────────────────────────────────────────────── */

console.log("\n── 1. Kategori yang perlu dibuat ──");
for (const [slug, nama, indukSlug] of BUAT) {
  if (cari(slug)) {
    console.log(`  · ${slug} sudah ada`);
    continue;
  }
  const induk = indukSlug ? cari(indukSlug)?.id ?? 0 : 0;
  console.log(`  + ${slug.padEnd(20)} "${nama}"${indukSlug ? ` (anak ${indukSlug})` : ""}`);
  if (TERAPKAN) {
    const { data } = await wp("/categories", {
      metode: "POST",
      data: { name: nama, slug, parent: induk },
    });
    kategori.set(slug, data);
  } else {
    // Tinjauan: catat sebagai calon supaya langkah 4 tetap bisa
    // menampilkan rencana penggabungan yang menuju ke sini.
    kategori.set(slug, { id: null, slug, name: nama, parent: induk, count: 0 });
  }
}

/* ── 2. GANTI ──────────────────────────────────────────────────────── */

console.log("\n── 2. Ganti nama/slug (nol artikel disentuh) ──");
for (const [lama, baru, nama] of GANTI) {
  const cat = cari(lama);
  if (!cat) {
    console.log(`  ! lewati: '${lama}' tidak ditemukan`);
    continue;
  }
  if (cat.slug === baru && cat.name === nama) {
    console.log(`  · ${lama} sudah sesuai`);
    continue;
  }
  console.log(`  ~ ${lama.padEnd(20)} (${cat.count} tulisan) → "${nama}" [${baru}]`);
  if (TERAPKAN) {
    const { data } = await wp(`/categories/${cat.id}`, {
      metode: "POST",
      data: { name: nama, slug: baru },
    });
    kategori.delete(lama);
    kategori.set(baru, data);
  } else if (baru !== lama) {
    // Term-nya sama, hanya berganti nama — jadi id-nya tetap dan langkah 4
    // bisa meninjau penggabungan yang menuju slug baru ini.
    kategori.delete(lama);
    kategori.set(baru, { ...cat, slug: baru, name: nama });
  }
}

/* ── 3. INDUK ──────────────────────────────────────────────────────── */

console.log("\n── 3. Susun ulang hierarki (nol artikel disentuh) ──");
for (const [anakSlug, indukSlug] of INDUK) {
  const anak = cari(anakSlug);
  if (!anak) {
    console.log(`  ! lewati: '${anakSlug}' tidak ditemukan`);
    continue;
  }
  const indukId = indukSlug ? cari(indukSlug)?.id ?? 0 : 0;
  if (anak.parent === indukId) {
    console.log(`  · ${anakSlug} sudah pada tempatnya`);
    continue;
  }
  console.log(`  ~ ${anakSlug.padEnd(24)} → ${indukSlug ?? "tingkat teratas"}`);
  if (TERAPKAN) {
    await wp(`/categories/${anak.id}`, { metode: "POST", data: { parent: indukId } });
  }
}

/* ── 4. GABUNG ─────────────────────────────────────────────────────── */

console.log("\n── 4. Gabungkan (tulisan terbit dipindahkan, asal dihapus) ──");
if (TERAPKAN) kategori = await muatKategori();

let totalPindah = 0;
for (const [asalSlug, tujuanSlug] of GABUNG) {
  const asal = cari(asalSlug);
  const tujuan = cari(tujuanSlug);
  if (!asal) {
    console.log(`  ! lewati: '${asalSlug}' tidak ditemukan`);
    continue;
  }
  if (!tujuan) {
    console.log(`  ! lewati: tujuan '${tujuanSlug}' tidak ditemukan`);
    continue;
  }

  const terbit = await hitung(asal.id, "publish");
  const sampah = await hitung(asal.id, "trash");
  console.log(
    `  → ${asalSlug.padEnd(24)} ${String(terbit).padStart(4)} terbit` +
      ` + ${String(sampah).padStart(4)} di tong sampah  →  ${tujuanSlug}` +
      (tujuan.id === null ? " (dibuat di langkah 1)" : "")
  );

  if (!TERAPKAN) continue;

  // Ambil seluruh tulisan terbit di kategori asal, sepuluh halaman pun
  // diambil sampai habis.
  for (;;) {
    const { data: batch } = await wp("/posts", {
      query: { categories: asal.id, status: "publish", per_page: 100, _fields: "id,categories" },
    });
    if (batch.length === 0) break;

    const { selesai, gagal } = await berkelompok(
      batch,
      (pos) => {
        const baru = pos.categories.filter((id) => id !== asal.id);
        if (!baru.includes(tujuan.id)) baru.push(tujuan.id);
        return wp(`/posts/${pos.id}`, { metode: "POST", data: { categories: baru } });
      },
      { label: `    ${asalSlug}: `, tiap: 50 }
    );
    totalPindah += selesai;
    if (gagal > 0 && selesai === 0) {
      console.error(`    Berhenti pada '${asalSlug}': seluruh permintaan gagal.`);
      process.exit(1);
    }
  }

  // Kategori asal dihapus hanya setelah tidak ada lagi tulisan terbit di
  // dalamnya. Tulisan di Tong Sampah ikut kehilangan kaitannya — itu arsip
  // 2022 ke bawah yang memang tidak ditampilkan lagi.
  const sisa = await hitung(asal.id, "publish");
  if (sisa > 0) {
    console.log(`    ! masih ada ${sisa} tulisan terbit — kategori tidak dihapus`);
    continue;
  }
  await wp(`/categories/${asal.id}`, { metode: "DELETE", query: { force: true } });
  kategori.delete(asalSlug);
  console.log(`    kategori '${asalSlug}' dihapus`);
}

if (!TERAPKAN) {
  console.log(
    "\nTinjauan selesai — tidak ada yang diubah." +
      "\nJalankan sungguhan (setelah backup):  APPLY=1 node wordpress/rest/rubrik.mjs"
  );
} else {
  console.log(`\nSelesai. ${totalPindah} tulisan dipindahkan kategorinya.`);
  console.log(
    "Langkah terakhir yang tidak ada padanannya di REST:" +
      "\n  wp-admin → Pengaturan → Permalink → Simpan Perubahan (menyegarkan rewrite)."
  );
}
