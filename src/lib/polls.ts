import { polls, type Poll } from "@/data/polls";
import { articleHref, categoryName, getArticle } from "./articles";

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

/** Lengkapi poll dengan info artikel sumbernya. */
export function toPollView(poll: Poll): PollView {
  const a = getArticle(poll.articleSlug);
  return {
    poll,
    sourceHref: a ? articleHref(a) : "#",
    sourceTitle: a?.title ?? "",
    sourceCategory: a ? categoryName(a.category) : "Jajak Pendapat",
    closed: isPollClosed(poll),
  };
}

/** Semua poll, terbaru dulu. */
export function activePolls(): Poll[] {
  return [...polls].sort((a, b) => b.date.localeCompare(a.date));
}

/** Poll milik satu artikel (0 atau lebih). */
export function pollsForArticle(slug: string): Poll[] {
  return activePolls().filter((p) => p.articleSlug === slug);
}

/** View poll teraktif untuk homepage. */
export function latestPollView(): PollView | null {
  const list = activePolls();
  return list.length ? toPollView(list[0]) : null;
}
