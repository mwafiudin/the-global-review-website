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
  // Pesan galat formulir kontak (api/contact)
  "Nama wajib diisi": "Name is required",
  "Nomor telepon terlalu panjang": "Phone number is too long",
  "Subjek tidak dikenal": "Unknown subject",
  "Pesan wajib diisi": "Message is required",
  "Pesan terlalu panjang": "Message is too long",
  "Formulir kontak belum dikonfigurasi": "The contact form is not configured yet",
  "Pesan gagal terkirim, coba lagi nanti": "Message failed to send, please try again later",
  "Pesan gagal terkirim, coba lagi nanti.": "Message failed to send, please try again later.",
  // Metadata situs (layout)
  "Media online yang dimiliki Global Future Institute. The Global Review menyajikan analisis dan opini politik luar negeri serta geopolitik dari Indonesia.":
    "An online publication of the Global Future Institute. The Global Review presents foreign-policy and geopolitical analysis and opinion from Indonesia.",
  "The Global Review — jurnalisme independen, analisis mendalam":
    "The Global Review — independent journalism, in-depth analysis",
  // Beranda & seksi
  "Isu Utama": "Top Story",
  Sorotan: "Highlights",
  "Lihat semua": "View all",
  "Tulisan Lainnya": "More Articles",
  "Belum ada artikel pada rubrik ini.": "No articles in this section yet.",
  "Sosial & Budaya": "Society & Culture",
  Terpopuler: "Most Read",
  "Podcast Terbaru": "Latest Podcasts",
  "Semua podcast": "All podcasts",
  "Buku pilihan": "Featured book",
  "Baca ulasannya": "Read the review",
  "Ikuti di Facebook": "Follow on Facebook",
  pengikut: "followers",
  "Suka Halaman": "Like Page",
  "Jaringan Rujukan": "Reference Network",
  "Sumber dan mitra pantauan kami, dari lembaga resmi dalam negeri hingga media analisis lintas kawasan.":
    "The sources and partners we monitor, from official domestic institutions to analytical media across regions.",
  Indonesia: "Indonesia",
  // BrandBand
  "Mengenal dunia, mengenal negeri kita sendiri.":
    "To know the world is to know our own country.",
  "The Global Review adalah kanal jurnalistik":
    "The Global Review is the journalistic channel of",
  ", lembaga pengkajian geopolitik dan politik luar negeri yang berdiri pada 2007. Sejak 2008 kami menyebarluaskan pikiran para pengkaji masalah internasional — bukan mengejar kecepatan kabar, melainkan kejernihan membaca arah dunia.":
    ", a geopolitics and foreign-policy think tank established in 2007. Since 2008 we have carried the thinking of scholars of international affairs — pursuing not the speed of news, but clarity in reading where the world is heading.",
  "Analisis, opini, dan kajian kawasan kami susun untuk pembaca yang ingin memahami mengapa sebuah peristiwa terjadi, bukan sekadar mengetahui bahwa ia terjadi.":
    "We craft our analysis, opinion, and regional studies for readers who want to understand why an event happens, not merely to know that it did.",
  "Tentang The Global Review": "About The Global Review",
  // Halaman artikel
  "menit baca": "min read",
  Penulis: "Author",
  Sebelumnya: "Previous",
  Selanjutnya: "Next",
  Berikutnya: "Next",
  "Lainnya di": "More in",
  "Navigasi artikel": "Article navigation",
  "Artikel terkait": "Related articles",
  Bagikan: "Share",
  "Salin tautan": "Copy link",
  "Bagikan ke WhatsApp": "Share to WhatsApp",
  "Bagikan ke X": "Share to X",
  // Arsip rubrik & paginasi
  artikel: "articles",
  "Semua penulis": "All authors",
  "Semua waktu": "All time",
  "Bulan ini": "This month",
  "Tahun ini": "This year",
  Terbaru: "Newest",
  Terlama: "Oldest",
  "Waktu baca tercepat": "Shortest read",
  "Filter penulis": "Filter by author",
  "Filter waktu": "Filter by time",
  Urutkan: "Sort",
  "Tidak ada artikel yang cocok": "No matching articles",
  "Coba longgarkan filter untuk rubrik": "Try loosening the filters for",
  "Reset filter": "Reset filters",
  "Navigasi halaman": "Page navigation",
  "Navigasi halaman arsip": "Archive page navigation",
  "Halaman sebelumnya": "Previous page",
  "Halaman berikutnya": "Next page",
  Beranda: "Home",
  "Kembali ke atas": "Back to top",
  // Pencarian
  "Cari artikel, rubrik, topik…": "Search articles, sections, topics…",
  "Tutup pencarian": "Close search",
  "Jelajahi rubrik": "Browse sections",
  "Tidak ada hasil untuk": "No results for",
  "Coba kata kunci lain atau jelajahi rubrik.":
    "Try a different keyword or browse the sections.",
  Mencari: "Searching",
  hasil: "results",
  buka: "open",
  tutup: "close",
  // Jajak pendapat
  "Jajak Pendapat": "Reader Poll",
  "Jajak pendapat": "Reader poll",
  Dipilih: "Chosen by",
  pembaca: "readers",
  "Ubah pilihan": "Change choice",
  "Bagikan poll ke WhatsApp": "Share poll to WhatsApp",
  "Bagikan poll ke X": "Share poll to X",
  "Baca artikel sumber": "Read the source article",
  // Formulir kontak
  Nama: "Name",
  Telepon: "Phone",
  Subjek: "Subject",
  Pesan: "Message",
  "Pilih subjek…": "Choose a subject…",
  "Redaksi & Hak Jawab": "Editorial & Right of Reply",
  "Kerja Sama & Kemitraan": "Cooperation & Partnership",
  "Pertanyaan Umum": "General Inquiry",
  "Kirim Pesan": "Send Message",
  "Pesan Anda telah terkirim": "Your message has been sent",
  "Terima kasih. Redaksi akan merespons melalui email yang Anda cantumkan.":
    "Thank you. The editorial team will respond via the email you provided.",
  // 404 & galat
  "Halaman tidak ditemukan": "Page not found",
  "Halaman yang Anda cari mungkin telah dipindahkan atau tidak tersedia.":
    "The page you are looking for may have been moved or is unavailable.",
  "Kembali ke Beranda": "Back to Home",
  "Terjadi kesalahan": "Something went wrong",
  "Muat ulang": "Reload",
  // Halaman rubrik
  halaman: "page",
  dari: "of",
  Artikel: "Articles",
  "Belum ada artikel di rubrik ini": "No articles in this section yet",
  "Artikel untuk rubrik": "Articles for the",
  "akan tampil di sini setelah dipublikasikan.":
    "section will appear here once published.",
  // Kanal: penulis, podcast, bedah buku, galeri
  tulisan: "articles",
  "Tulisan Terbaru": "Latest Articles",
  "Belum ada tulisan.": "No articles yet.",
  "Belum ada album.": "No albums yet.",
  "Kembali ke Redaksi": "Back to the Editorial team",
  "Rekam jejak tim Global Future Institute sebagai narasumber di berbagai podcast, talkshow, dan kanal media, lengkap dengan tayangannya.":
    "The Global Future Institute team's appearances as speakers on podcasts, talk shows, and media channels, complete with the recordings.",
  "Narasumber:": "Speaker:",
  "Tayangan ini diproduksi dan diunggah oleh kanal":
    "This program was produced and uploaded by",
  ". The Global Review menautkannya sebagai bagian dari rekam jejak narasumber GFI.":
    ". The Global Review links to it as part of the GFI speakers' track record.",
  "Penampilan lainnya": "Other appearances",
  "Ulasan buku terbitan Global Future Institute dan bacaan pilihan redaksi.":
    "Reviews of Global Future Institute titles and the editors' selected reading.",
  "Buku Utama": "Featured Book",
  "Baca ulasan lengkap": "Read the full review",
  "Koleksi Lainnya": "More from the Collection",
  "Baca ulasan": "Read review",
  Ulasan: "Review",
  "Tonton diskusinya": "Watch the discussion",
  bersama: "with",
  di: "on",
  "Selengkapnya di Podcast": "More on Podcast",
  "Ulasan lainnya": "Other reviews",
  "Semua bedah buku": "All book reviews",
  "Album dokumentasi kegiatan Global Future Institute — seminar, diskusi, riset, hingga silaturahmi redaksi.":
    "Photo albums documenting Global Future Institute activities — seminars, discussions, research, and editorial gatherings.",
  foto: "photos",
  "Album Lainnya": "Other Albums",
  "Semua album": "All albums",
  // Tombol terjemah artikel (hanya tampil di /en — nilai EN yang terlihat)
};

/** Penerjemah untuk satu bahasa; dipakai bersama oleh sisi server & client. */
export function tFor(lang: "id" | "en") {
  return (s: string): string => (lang === "en" ? EN[s] ?? s : s);
}
