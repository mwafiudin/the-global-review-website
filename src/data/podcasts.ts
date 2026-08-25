export interface Podcast {
  slug: string;
  /** Headline yang ditulis redaksi TGR untuk penampilan ini. */
  headline: string;
  /** Nama kanal/media pengunggah (pemilik konten). */
  media: string;
  /** Narasumber dari tim GFI. */
  narasumber: string;
  /** Format acara, mis. "Talkshow", "Podcast", "Bedah Buku". */
  format: string;
  tanggal: string; // ISO, tanggal tayang asli di YouTube
  videoId: string;
  /** Ringkasan/artikel singkat, tiap elemen satu paragraf. */
  ringkasan: string[];
  featured?: boolean;
}

// Seluruh penampilan dikelola di wp-admin (CPT tgr_podcast). Snapshot
// hardcode 11 penampilan sudah dihapus — isinya sudah lama dimigrasikan ke
// WordPress, dan fallback diam-diam membuat situs terus memajang penampilan
// yang di wp-admin sudah ditarik. Koleksi kosong berarti halaman Podcast
// menampilkan keadaan kosong yang jujur.
