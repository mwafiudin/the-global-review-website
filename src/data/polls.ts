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

// Seluruh jajak pendapat dikelola di wp-admin (CPT tgr_poll). Data contoh
// dengan angka suara fiktif sudah dihapus — koleksi kosong berarti seksi
// poll memang tidak tampil, bukan diisi karangan.
