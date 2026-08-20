export interface Photo {
  seed: string;
  caption: string;
  /** URL asli dari media WordPress. */
  src: string;
}

export interface Album {
  slug: string;
  judul: string;
  kategori: string;
  tanggal: string; // ISO
  lokasi: string;
  ringkasan: string;
  foto: Photo[];
}

// Seluruh album dikelola di wp-admin (CPT tgr_album). Data contoh berfoto
// picsum sudah dihapus — koleksi kosong berarti halaman galeri menampilkan
// keadaan kosong yang jujur, bukan dokumentasi kegiatan karangan.
