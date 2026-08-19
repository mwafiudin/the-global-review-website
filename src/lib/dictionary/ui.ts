/**
 * Kamus antarmuka (UI), kunci = string sumber bahasa Indonesia.
 * Konvensi ini dipertahankan karena: (1) t(item.label) atas data dari
 * src/data/site.ts tetap jalan tanpa menyentuh call site; (2) entri yang
 * hilang terdegradasi aman ke bahasa Indonesia, bukan ke kode kunci.
 * Kelengkapannya dikunci ui.test.ts.
 *
 * Modul ini data murni (tanpa "use client"/server-only) supaya bisa diimpor
 * komponen server, komponen client, dan tes sekaligus.
 */
export const EN: Record<string, string> = {
  // Rubrik utama
  Analisis: "Analysis",
  Internasional: "International",
  Geopolitik: "Geopolitics",
  "Politik-Keamanan": "Politics & Security",
  "Ekonomi & Bisnis": "Economy & Business",
  // Isu
  Diplomasi: "Diplomacy",
  Hukum: "Law",
  Sosial: "Society",
  Budaya: "Culture",
  "Lingkungan Hidup": "Environment",
  "Sains & Teknologi": "Science & Tech",
  Kesehatan: "Health",
  // Liputan khusus
  "Sorot Tokoh": "Profiles",
  Features: "Features",
  Media: "Media",
  // Kanal
  "Bedah Buku": "Book Reviews",
  Podcast: "Podcast",
  Galeri: "Gallery",
  // Kawasan
  "Asia Tenggara": "Southeast Asia",
  "Asia Timur": "East Asia",
  "Asia Selatan": "South Asia",
  "Asia Tengah": "Central Asia",
  Australia: "Australia",
  "Timur Tengah": "Middle East",
  Afrika: "Africa",
  "Amerika Latin": "Latin America",
  // Tentang / utility
  "Tentang Kami": "About Us",
  Redaksi: "Editorial",
  "Hubungi Kami": "Contact",
  "Tentang Global Future Institute": "About Global Future Institute",
  "Pengurus GFI": "GFI Board",
  // Header: grup & seksi
  Lainnya: "More",
  Utama: "Main",
  Isu: "Issues",
  "Liputan Khusus": "Special Coverage",
  Kanal: "Channels",
  Tentang: "About",
  Lembaga: "Institution",
  Semua: "All",
  Bahasa: "Language",
  // Header: aria
  "Cari artikel": "Search articles",
  "Ganti mode terang/gelap": "Toggle light/dark mode",
  "Buka menu": "Open menu",
  "Tutup menu": "Close menu",
  // Footer
  "Diterbitkan oleh": "Published by",
  "Lembaga pengkajian geopolitik dan politik luar negeri, berdiri 11 Oktober 2007.":
    "A geopolitics and foreign-policy think tank, established 11 October 2007.",
  "adalah kanal jurnalistiknya.": "is its journalistic channel.",
  "Tentang GFI": "About GFI",
  // Motto
  "Pemandu Informasi Perkembangan Dunia": "Your Guide to World Affairs",
  // CTA buletin
  "Buletin The Global Review": "The Global Review Newsletter",
  "Independen dan mendalam, langsung ke email Anda.":
    "Independent and in-depth, straight to your inbox.",
  "Analisis geopolitik pilihan redaksi. Tanpa spam, berhenti kapan saja.":
    "Curated geopolitical analysis. No spam, unsubscribe anytime.",
  "Alamat email Anda": "Your email address",
  Berlangganan: "Subscribe",
  "Terima kasih, Anda sudah terdaftar.": "Thank you, you're subscribed.",
  "Pendaftaran gagal, coba lagi nanti.": "Subscription failed, please try again later.",
  // Rubrik arsip di luar menu
  "Komentar Pembaca": "Readers' Comments",
  // Pesan galat API yang dirender komponen client
  "Alamat email tidak sah": "Invalid email address",
  "Terlalu banyak percobaan, coba lagi sebentar lagi":
    "Too many attempts, please try again shortly",
  "Pendaftaran buletin belum dikonfigurasi":
    "Newsletter signup is not configured yet",
  "Pendaftaran gagal, coba lagi nanti": "Subscription failed, please try again later",
  // Metadata situs (layout)
  "Media online yang dimiliki Global Future Institute. The Global Review menyajikan analisis dan opini politik luar negeri serta geopolitik dari Indonesia.":
    "An online publication of the Global Future Institute. The Global Review presents foreign-policy and geopolitical analysis and opinion from Indonesia.",
  "The Global Review — jurnalisme independen, analisis mendalam":
    "The Global Review — independent journalism, in-depth analysis",
};

/** Penerjemah untuk satu bahasa; dipakai bersama oleh sisi server & client. */
export function tFor(lang: "id" | "en") {
  return (s: string): string => (lang === "en" ? EN[s] ?? s : s);
}
