import { polls, type Poll } from "@/data/polls";

/**
 * Helper murni jajak pendapat — sinkron dan bebas fetch karena diimpor
 * komponen client (PollCard, PollCarousel). Penggabungan poll dengan
 * artikel sumbernya (butuh WordPress) ada di src/lib/wp/polls.ts.
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
  return Date.now() > new Date(poll.closesAt + "T23:59:59").getTime();
}

/** Total suara dasar sebuah poll. */
export function pollBaseTotal(poll: Poll): number {
  return poll.options.reduce((n, o) => n + o.base, 0);
}

/** Semua poll, terbaru dulu. */
export function activePolls(): Poll[] {
  return [...polls].sort((a, b) => b.date.localeCompare(a.date));
}

/** Poll milik satu artikel (0 atau lebih). */
export function pollsForArticle(slug: string): Poll[] {
  return activePolls().filter((p) => p.articleSlug === slug);
}
