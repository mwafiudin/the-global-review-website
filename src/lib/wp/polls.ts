import "server-only";

import type { Poll } from "@/data/polls";
import { articleHref, categoryName } from "@/lib/articles";
import { isPollClosed, type PollView } from "@/lib/polls";
import { getArticle } from "./articles";

/** Lengkapi poll dengan info artikel sumbernya (judul, rubrik, tautan). */
export async function toPollView(poll: Poll): Promise<PollView> {
  const a = await getArticle(poll.articleSlug);
  return {
    poll,
    sourceHref: a ? articleHref(a) : "#",
    sourceTitle: a?.title ?? "",
    sourceCategory: a ? categoryName(a.category) : "Jajak Pendapat",
    closed: isPollClosed(poll),
  };
}
