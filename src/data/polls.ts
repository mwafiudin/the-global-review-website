export interface PollOption {
  id: string;
  label: string;
  /** Angka pembuka yang diketik redaksi, sebelum pembaca ikut memilih. */
  base: number;
  /** Suara pembaca yang tercatat di WordPress. */
  suara?: number;
}

export interface Poll {
  id: string;
  /** ID pos WordPress — alamat tujuan saat pembaca mengirim suaranya. */
  wpId?: number;
  /** Slug artikel yang membuat poll ini. */
  articleSlug: string;
  question: string;
  options: PollOption[];
  date: string; // ISO, untuk menentukan poll teraktif
  /** Tanggal poll ditutup (ISO). Bila lewat, voting dikunci. */
  closesAt?: string;
}

// Poll masih dikelola di frontend; articleSlug menunjuk artikel WordPress
// produksi yang relevan. Pindah ke CPT tgr_poll setelah mu-plugin terpasang.
// Satu artikel bisa punya 0 atau lebih poll (relasi via articleSlug).
export const polls: Poll[] = [
  {
    id: "poll-indopasifik",
    articleSlug: "militerisme-jepang-strategi-indo-pasifik-as-dan-kekhawatiran-china",
    question:
      "Bagaimana sebaiknya Indonesia memposisikan diri dalam rivalitas AS-Cina di Indo-Pasifik?",
    date: "2026-07-07",
    closesAt: "2026-08-07",
    options: [
      { id: "netral", label: "Netral aktif, jaga jarak dari semua kutub", base: 428 },
      { id: "asean", label: "Perkuat ASEAN sebagai penyeimbang", base: 356 },
      { id: "mandiri", label: "Bangun kekuatan pertahanan mandiri", base: 291 },
      { id: "ekonomi", label: "Utamakan kepentingan ekonomi", base: 173 },
    ],
  },
  {
    id: "poll-natuna",
    articleSlug: "mewaspadai-ancaman-frontier-di-perbatasan",
    question: "Sikap apa yang paling tepat untuk menjaga Natuna Utara?",
    date: "2026-07-05",
    closesAt: "2026-08-05",
    options: [
      { id: "patroli", label: "Perkuat patroli militer", base: 512 },
      { id: "nelayan", label: "Berdayakan nelayan & ekonomi pesisir", base: 389 },
      { id: "diplomasi", label: "Diplomasi tegas ke Beijing", base: 244 },
      { id: "forum", label: "Bawa ke forum internasional", base: 118 },
    ],
  },
  {
    id: "poll-multipolar",
    articleSlug: "non-blok-dalam-pusaran-as-china-rusia-iran",
    question: "Apakah dunia multipolar lebih menguntungkan kepentingan Indonesia?",
    date: "2026-07-02",
    closesAt: "2026-07-20",
    options: [
      { id: "ya", label: "Ya, memberi ruang tawar lebih luas", base: 617 },
      { id: "tergantung", label: "Tergantung cara Indonesia mengelolanya", base: 402 },
      { id: "tidak", label: "Tidak, menambah ketidakpastian", base: 145 },
    ],
  },
];
