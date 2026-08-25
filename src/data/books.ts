export interface Book {
  slug: string;
  judul: string;
  /** Nama untuk byline kartu; ringkas (mis. "Hendrajit dkk."). */
  penulis: string;
  /** Daftar penulis/kontributor lengkap, ditampilkan di halaman ulasan. */
  penulisLengkap?: string;
  penerbit: string;
  /** Tahun terbit; dikosongkan bila belum terkonfirmasi. */
  tahun?: string;
  /** ISBN dari sampul belakang (opsional). */
  isbn?: string;
  cover: string;
  /** Ringkasan pendek untuk kartu daftar. */
  ringkasan: string;
  /** Ulasan lengkap, tiap elemen satu paragraf. */
  ulasan: string[];
  /** Slug podcast/video terkait (opsional) untuk embed di halaman ulasan. */
  podcastTerkait?: string;
  /** Satu buku ber-nilai true tampil di kartu "Buku pilihan" sidebar. */
  unggulan?: boolean;
}

// Seluruh ulasan dikelola di wp-admin (kategori bedah-buku + meta Identitas
// Buku). Snapshot hardcode 4 ulasan sudah dihapus — isinya sudah terbit di
// WordPress, dan fallback diam-diam membuat situs terus memajang ulasan yang
// di wp-admin sudah ditarik. Koleksi kosong berarti halaman Bedah Buku
// menampilkan keadaan kosong yang jujur.

/** "Global Future Institute (2019)" — tahun disembunyikan bila belum diketahui. */
export function bookImprint(book: Book): string {
  return book.tahun ? `${book.penerbit} (${book.tahun})` : book.penerbit;
}

/**
 * "Hendrajit, Global Future Institute (2010)" — bagian yang kosong ikut
 * hilang beserta pemisahnya. Ulasan yang datang dari kategori Bedah Buku
 * di WordPress belum tentu punya identitas penerbit, dan tanpa ini
 * barisnya berakhir dengan koma menggantung.
 */
export function bookByline(book: Book): string {
  return [book.penulis, bookImprint(book)].filter(Boolean).join(", ");
}
