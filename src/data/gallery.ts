export interface Photo {
  seed: string;
  caption: string;
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

export const albums: Album[] = [
  {
    slug: "seminar-geopolitik-indo-pasifik",
    judul: "Seminar Geopolitik Indo-Pasifik",
    kategori: "Seminar",
    tanggal: "2026-05-18",
    lokasi: "Jakarta",
    ringkasan:
      "Seminar bertema persaingan kekuatan besar di Indo-Pasifik dan posisi tawar Indonesia.",
    foto: [
      { seed: "gfi-seminar-1", caption: "Pemaparan kunci arah geopolitik kawasan" },
      { seed: "gfi-seminar-2", caption: "Sesi diskusi panel bersama narasumber" },
      { seed: "gfi-seminar-3", caption: "Antusiasme peserta dalam sesi tanya jawab" },
      { seed: "gfi-seminar-4", caption: "Ramah tamah seusai acara" },
    ],
  },
  {
    slug: "bedah-buku-perang-asimetris",
    judul: "Bedah Buku Perang Asimetris",
    kategori: "Bedah Buku",
    tanggal: "2026-03-22",
    lokasi: "Jakarta",
    ringkasan:
      "Diskusi buku Perang Asimetris & Skema Penjajahan Gaya Baru bersama penulis dan pembahas.",
    foto: [
      { seed: "gfi-bedahbuku-1", caption: "Penulis memaparkan tesis utama buku" },
      { seed: "gfi-bedahbuku-2", caption: "Tanggapan dari pembahas undangan" },
      { seed: "gfi-bedahbuku-3", caption: "Penyerahan buku kepada peserta" },
    ],
  },
  {
    slug: "kuliah-umum-kampus-mitra",
    judul: "Kuliah Umum di Kampus Mitra",
    kategori: "Pendidikan",
    tanggal: "2026-02-14",
    lokasi: "Semarang",
    ringkasan:
      "Kuliah umum hubungan internasional dan geopolitik bagi mahasiswa kampus mitra.",
    foto: [
      { seed: "gfi-kampus-1", caption: "Kuliah umum di hadapan mahasiswa" },
      { seed: "gfi-kampus-2", caption: "Diskusi interaktif di ruang kelas" },
      { seed: "gfi-kampus-3", caption: "Foto bersama sivitas akademika" },
      { seed: "gfi-kampus-4", caption: "Penyerahan cindera mata kerja sama" },
    ],
  },
  {
    slug: "fgd-pertahanan-keamanan",
    judul: "FGD Pertahanan & Keamanan",
    kategori: "Diskusi",
    tanggal: "2025-12-09",
    lokasi: "Jakarta",
    ringkasan:
      "Focus group discussion tertutup membahas isu pertahanan dan keamanan nasional.",
    foto: [
      { seed: "gfi-fgd-1", caption: "Diskusi terbatas para pakar" },
      { seed: "gfi-fgd-2", caption: "Pemetaan isu strategis di papan" },
      { seed: "gfi-fgd-3", caption: "Perumusan rekomendasi kebijakan" },
    ],
  },
  {
    slug: "media-briefing-situasi-global",
    judul: "Media Briefing Situasi Global",
    kategori: "Media",
    tanggal: "2025-10-27",
    lokasi: "Jakarta",
    ringkasan:
      "Pengarahan media mengenai perkembangan situasi global terkini dan dampaknya bagi Indonesia.",
    foto: [
      { seed: "gfi-media-1", caption: "Pengarahan kepada awak media" },
      { seed: "gfi-media-2", caption: "Sesi wawancara dengan jurnalis" },
      { seed: "gfi-media-3", caption: "Dokumentasi rilis analisis" },
    ],
  },
  {
    slug: "silaturahmi-redaksi-kontributor",
    judul: "Silaturahmi Redaksi & Kontributor",
    kategori: "Internal",
    tanggal: "2025-08-16",
    lokasi: "Jakarta",
    ringkasan:
      "Pertemuan tahunan redaksi bersama para kontributor dan jaringan penulis.",
    foto: [
      { seed: "gfi-silaturahmi-1", caption: "Sambutan pemimpin redaksi" },
      { seed: "gfi-silaturahmi-2", caption: "Ramah tamah antar kontributor" },
      { seed: "gfi-silaturahmi-3", caption: "Foto bersama keluarga besar redaksi" },
    ],
  },
];

export function getAlbum(slug: string): Album | undefined {
  return albums.find((a) => a.slug === slug);
}

/** URL gambar placeholder (dummy) untuk sebuah foto. */
export function photoSrc(seed: string, w = 800, h = 560): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}
