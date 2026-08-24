/**
 * Daftar layar wp-admin yang dipotret untuk docs/panduan-redaksi.md.
 *
 * Dipisah dari runner-nya supaya menambah satu layar cukup menambah satu
 * entri di sini — tanpa menyentuh logika Playwright sama sekali.
 *
 * Bentuk entri:
 *   nama        nama berkas keluaran, tanpa awalan "wp-" dan tanpa ".png"
 *   url         fungsi (ctx) → path relatif terhadap /wp-admin/
 *   tunggu      selector yang harus hadir sebelum dipotret
 *   potong      selector elemen yang dipotret; null = seluruh viewport
 *   aksi        selector yang diklik lebih dulu (buka panel, dsb.)
 *   rapikan     CSS tambahan, mis. memangkas baris daftar yang kepanjangan
 *   samar       [{ sel, teks }] — isi elemen DIGANTI teks contoh SEBELUM
 *               dipotret, sehingga data pribadi pembaca tidak pernah masuk
 *               ke berkas PNG sama sekali
 *   penunjuk    [{ sel, nomor }] — lingkaran bernomor ditempel di elemen itu
 *   perlu       flag yang wajib diberikan agar layar ini ikut dipotret
 *   keterangan  dipakai runner untuk mencetak ringkasan; bukan caption
 */

/** Baris daftar dipangkas supaya gambarnya tidak setinggi satu halaman. */
const potongDaftar = (n) => `#the-list tr:nth-child(n+${n + 1}) { display: none; }`;

export const LAYAR = [
  /* ── Alur menulis ────────────────────────────────────────────────── */
  {
    nama: "daftar-tulisan-kolom-sorotan",
    url: () => "edit.php",
    tunggu: "#the-list",
    potong: "#posts-filter",
    rapikan: potongDaftar(6),
    penunjuk: [{ sel: "th.column-tgr_sorotan", nomor: 1 }],
    keterangan: "Kolom Sorotan di daftar Tulisan; yang kosong bertanda —",
  },
  {
    nama: "edit-pos-peta",
    url: (ctx) => `post.php?post=${ctx.pos}&action=edit`,
    tunggu: "#tgr_sorotan",
    potong: null,
    penunjuk: [
      { sel: "#titlediv", nomor: 1 },
      { sel: "#postimagediv", nomor: 2 },
      { sel: "#tgr_isi_sorotan", nomor: 3 },
      { sel: "#submitdiv", nomor: 4 },
    ],
    keterangan: "Peta layar sunting: judul, gambar unggulan, sorotan, terbitkan",
  },
  {
    nama: "gambar-unggulan",
    url: (ctx) => `post.php?post=${ctx.pos}&action=edit`,
    tunggu: "#postimagediv",
    potong: "#postimagediv",
    keterangan: "Kotak Featured Image",
  },
  {
    nama: "kutipan",
    url: (ctx) => `post.php?post=${ctx.pos}&action=edit`,
    tunggu: "#postexcerpt",
    potong: "#postexcerpt",
    keterangan: "Kotak Kutipan di bawah editor",
  },
  {
    nama: "sorotan-judul",
    url: (ctx) => `post.php?post=${ctx.pos}&action=edit`,
    tunggu: "#tgr_sorotan",
    potong: "#tgr_isi_sorotan",
    penunjuk: [{ sel: "#tgr_sorotan", nomor: 1 }],
    keterangan: "Kotak Sorotan Judul di sisi kanan",
  },
  {
    nama: "terbitkan-visibilitas-lekatkan",
    url: (ctx) => `post.php?post=${ctx.pos}&action=edit`,
    tunggu: "#submitdiv",
    // Panel Visibilitas tertutup secara bawaan; centang "Lekatkan di atas
    // blog" baru terlihat setelah tautan Sunting-nya diklik.
    aksi: ["a.edit-visibility"],
    potong: "#submitdiv",
    penunjuk: [{ sel: "#sticky", nomor: 1 }],
    keterangan: "Terbitkan → Visibilitas → Sunting → Lekatkan di atas blog",
  },
  {
    nama: "identitas-buku",
    url: (ctx) => `post.php?post=${ctx.pos}&action=edit`,
    tunggu: "#tgr_isi_buku",
    potong: "#tgr_isi_buku",
    keterangan: "Kotak Identitas Buku — rubrik Bedah Buku",
  },

  /* ── Layar yang butuh tulisan uji sekali pakai ───────────────────── */
  {
    nama: "sorotan-peringatan-merah",
    perlu: "uji-terbit",
    url: (ctx) => `post.php?post=${ctx.posUji}&action=edit`,
    tunggu: "#publish",
    // Kotak sorotan dikosongkan lalu Terbitkan ditekan: gerbangnya
    // menahan tulisan di draf dan memunculkan peringatan merah — itulah
    // yang dipotret. Tulisan uji dihapus permanen setelahnya.
    aksi: ["#tgr_sorotan::kosongkan", "#publish"],
    potong: ".wrap",
    rapikan: "#post-body, #poststuff .postbox { display: none; }",
    keterangan: "Peringatan merah saat terbit ditahan (butuh tulisan uji)",
  },
  {
    nama: "notice-situs-diperbarui",
    perlu: "uji-terbit",
    url: (ctx) => `post.php?post=${ctx.posUji}&action=edit`,
    tunggu: ".notice",
    potong: ".wrap",
    rapikan: "#post-body, #poststuff .postbox { display: none; }",
    keterangan: "Pemberitahuan hijau/kuning setelah menyimpan",
  },

  /* ── Menu tambahan ───────────────────────────────────────────────── */
  {
    nama: "podcast-detail",
    url: () => "post-new.php?post_type=tgr_podcast",
    tunggu: "#tgr_isi_podcast",
    potong: "#tgr_isi_podcast",
    penunjuk: [
      { sel: "#tgr_video_id", nomor: 1 },
      { sel: "#tgr_tayang", nomor: 2 },
    ],
    keterangan: "Kotak Detail Penampilan pada Podcast baru",
  },
  {
    nama: "podcast-daftar",
    url: () => "edit.php?post_type=tgr_podcast",
    tunggu: "#the-list",
    potong: "#posts-filter",
    rapikan: potongDaftar(6),
    keterangan: "Daftar Podcast: kolom Kanal, Format, Tayang, Utama",
  },
  {
    nama: "album-detail",
    url: () => "post-new.php?post_type=tgr_album",
    tunggu: "#tgr_isi_album",
    potong: "#tgr_isi_album",
    penunjuk: [{ sel: "#tgr-foto-pilih", nomor: 1 }],
    keterangan: "Kotak Detail Album + tombol Pilih foto",
  },
  {
    nama: "jajak-detail",
    url: () => "post-new.php?post_type=tgr_poll",
    tunggu: "#tgr_isi_poll",
    potong: "#tgr_isi_poll",
    penunjuk: [
      { sel: "#tgr_artikel_id", nomor: 1 },
      { sel: "#tgr-opsi-tambah", nomor: 2 },
    ],
    keterangan: "Kotak Isi Jajak Pendapat + tombol Tambah pilihan",
  },
  {
    nama: "jajak-suara-pembaca",
    perlu: "jajak",
    url: (ctx) => `post.php?post=${ctx.jajak}&action=edit`,
    tunggu: "#tgr_isi_poll",
    potong: "#tgr_isi_poll",
    keterangan: "Bagian Suara pembaca (butuh jajak pendapat contoh)",
  },
  {
    nama: "orang-detail-profil",
    url: (ctx) => `post.php?post=${ctx.orang}&action=edit`,
    tunggu: "#tgr_isi_orang",
    potong: "#tgr_isi_orang",
    penunjuk: [
      { sel: "input[name='tgr_kelompok']", nomor: 1 },
      { sel: "#tgr_jabatan", nomor: 2 },
    ],
    keterangan: "Kotak Detail Profil: Kelompok, Jabatan, Bio",
  },
  {
    nama: "orang-atribut-urutan",
    url: (ctx) => `post.php?post=${ctx.orang}&action=edit`,
    tunggu: "#pageparentdiv",
    potong: "#pageparentdiv",
    keterangan: "Atribut → Urutan pada Pengurus & Redaksi",
  },
  {
    nama: "laman-isi-halaman",
    url: (ctx) => `post.php?post=${ctx.laman}&action=edit`,
    tunggu: "#tgr_isi_halaman",
    potong: "#tgr_isi_halaman",
    rapikan: "#tgr_isi_halaman .inside table tr:nth-child(n+6) { display: none; }",
    keterangan: "Kotak Isi Halaman — Situs Baru (dipangkas 5 baris pertama)",
  },

  /* ── Layar berisi data pribadi: seluruh nilainya diganti contoh ──── */
  {
    nama: "pelanggan-buletin",
    url: () => "edit.php?post_type=tgr_subscriber",
    tunggu: "#the-list",
    potong: "#posts-filter",
    rapikan: potongDaftar(5),
    samar: [{ sel: "#the-list .column-title", teks: "pembaca@contoh.com" }],
    keterangan: "Daftar Pelanggan Buletin + tombol Unduh CSV (email disamarkan)",
  },
  {
    nama: "pesan-masuk",
    url: () => "edit.php?post_type=tgr_pesan",
    tunggu: "#the-list",
    potong: "#posts-filter",
    rapikan: potongDaftar(5),
    samar: [
      { sel: "#the-list .column-title", teks: "Nama Pengirim" },
      { sel: "#the-list .column-tgr_email", teks: "pengirim@contoh.com" },
      { sel: "#the-list .column-tgr_subjek", teks: "Pertanyaan tentang artikel" },
    ],
    penunjuk: [{ sel: "th.column-tgr_email_terkirim", nomor: 1 }],
    keterangan: "Daftar Pesan Masuk + kolom Notifikasi (data disamarkan)",
  },
];

/** Nama layar yang menulis apa pun ke produksi — dipakai runner untuk peringatan. */
export const LAYAR_MENULIS = new Set(["sorotan-peringatan-merah", "notice-situs-diperbarui"]);
