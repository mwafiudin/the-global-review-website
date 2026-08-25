import type { Poll } from "@/data/polls";

/**
 * Helper murni jajak pendapat — sinkron dan bebas fetch karena diimpor
 * komponen client (PollCard, PollCarousel). Pengambilan poll (CPT tgr_poll,
 * fallback data contoh) dan penggabungannya dengan artikel sumber ada di
 * src/lib/wp/polls.ts.
 */

export interface PollView {
  poll: Poll;
  sourceHref: string;
  sourceTitle: string;
  sourceCategory: string;
  closed: boolean;
}

/** Apakah poll sudah ditutup (dihitung di server, bukan saat render React). */
export function isPollClosed(poll: Poll): boolean {
  if (!poll.closesAt) return false;
  // Offset WIB eksplisit: tanggal tutup redaksi adalah tanggal Jakarta, dan
  // gerbang suara di mu-plugin menutup pada tengah malam WIB. Tanpa offset,
  // server Vercel (UTC) menganggap poll masih buka 7 jam lebih lama — kartu
  // "AKTIF" yang suaranya ditolak 409 oleh WordPress.
  return Date.now() > new Date(poll.closesAt + "T23:59:59+07:00").getTime();
}

/** Total suara sebuah poll: angka pembuka redaksi + suara pembaca. */
export function pollTotal(poll: Poll): number {
  return poll.options.reduce((n, o) => n + o.base + (o.suara ?? 0), 0);
}
