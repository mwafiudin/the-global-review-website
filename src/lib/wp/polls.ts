import "server-only";

import { unstable_cache } from "next/cache";
import { polls as contohPolls, type Poll, type PollOption } from "@/data/polls";
import { articleHref, categoryName } from "@/lib/articles";
import type { Article } from "@/lib/types";
import { isPollClosed, type PollView } from "@/lib/polls";
import {
  dedup,
  wpFetchAllFresh,
  wpFetchByIdsFresh,
  type WpRendered,
} from "./client";
import { cleanText, isoDate } from "./map";
import { articlesBySlugs } from "./articles";

/**
 * Jajak pendapat dari CPT tgr_poll (rest_base: polls). Pertanyaan, opsi
 * (dengan suara dasar), tanggal tutup, dan artikel sumber seluruhnya
 * dikelola redaksi di wp-admin. Relasi ke artikel disimpan sebagai ID pos
 * (meta tgr_artikel_id) dan di-resolve ke slug di sini. Koleksi
 * kosong/gagal → data contoh src/data/polls.ts.
 *
 * Penghitungan suara pengunjung tetap di sisi klien (Fase 2b: endpoint
 * tulis di mu-plugin agar suara tersimpan di WordPress).
 */

interface WpPoll {
  id: number;
  slug: string;
  date: string;
  title: WpRendered;
  meta?: {
    tgr_pertanyaan?: string;
    tgr_artikel_id?: number;
    tgr_tutup?: string;
    tgr_opsi?: Array<{ id?: string; label?: string; base?: number }>;
  };
}

/** Baris tgr_opsi yang tidak lengkap dibuang; base liar dijinakkan ke ≥0. */
export function wpPollOptions(
  raw: NonNullable<WpPoll["meta"]>["tgr_opsi"]
): PollOption[] {
  return (raw ?? [])
    .filter((o) => o.id && o.label)
    .map((o) => ({
      id: String(o.id),
      label: String(o.label),
      base: Math.max(0, Math.floor(Number(o.base) || 0)),
    }));
}

/** Poll tanpa pertanyaan, tanpa opsi, atau tanpa artikel sumber ter-resolve
 *  tidak dirender — kartu poll membutuhkan ketiganya. */
export function wpPollToPoll(
  item: WpPoll,
  articleSlugById: Map<number, string>
): Poll | null {
  const question =
    item.meta?.tgr_pertanyaan?.trim() || cleanText(item.title.rendered);
  const options = wpPollOptions(item.meta?.tgr_opsi);
  const articleSlug = articleSlugById.get(item.meta?.tgr_artikel_id ?? 0);
  if (!question || options.length < 2 || !articleSlug) return null;

  return {
    id: item.slug || `poll-${item.id}`,
    articleSlug,
    question,
    options,
    date: item.date.slice(0, 10),
    // Tanggal tutup yang tak terbaca lebih baik dianggap "tanpa batas"
    // daripada diteruskan mentah dan bikin isPollClosed selalu false.
    closesAt: isoDate(item.meta?.tgr_tutup) ?? undefined,
  };
}

const cachedPolls = unstable_cache(
  async (): Promise<Poll[]> => {
    const items = await wpFetchAllFresh<WpPoll>("/polls", {
      query: { _fields: "id,slug,date,title,meta" },
    });

    // Resolve seluruh artikel sumber sekaligus (dipotong per 100 ID).
    const posts = await wpFetchByIdsFresh<{ id: number; slug: string }>(
      "/posts",
      items.map((p) => p.meta?.tgr_artikel_id ?? 0),
      { query: { _fields: "id,slug" } }
    );
    const slugById = new Map(posts.map((p) => [p.id, p.slug]));

    return items
      .map((item) => wpPollToPoll(item, slugById))
      .filter((p): p is Poll => p !== null)
      .sort((a, b) => b.date.localeCompare(a.date));
  },
  ["wp-polls"],
  { revalidate: 300, tags: ["wp:polls"] }
);

/** Semua poll, terbaru dulu; koleksi kosong/gagal → data contoh. */
export async function wpActivePolls(): Promise<Poll[]> {
  return dedup("polls", async () => {
    try {
      const items = await cachedPolls();
      if (items.length > 0) return items;
    } catch {
      // WP tak terjangkau — data contoh menjaga seksi tetap hidup.
    }
    return [...contohPolls].sort((a, b) => b.date.localeCompare(a.date));
  });
}

/** Poll milik satu artikel (0 atau lebih). */
export async function wpPollsForArticle(slug: string): Promise<Poll[]> {
  return (await wpActivePolls()).filter((p) => p.articleSlug === slug);
}

/**
 * Lengkapi poll dengan info artikel sumbernya (judul, rubrik, tautan).
 * Seluruh sumber diambil dalam satu permintaan daftar, bukan satu
 * permintaan detail per poll; artikel yang gagal dibaca menyisakan kartu
 * tanpa tautan sumber alih-alih menggagalkan render halaman.
 */
export async function toPollViews(polls: Poll[]): Promise<PollView[]> {
  if (polls.length === 0) return [];

  let bySlug = new Map<string, Article>();
  try {
    const artikel = await articlesBySlugs(polls.map((p) => p.articleSlug));
    bySlug = new Map(artikel.map((a) => [a.slug, a]));
  } catch {
    // Biarkan kosong: kartu tetap tampil, tautan sumbernya saja yang mati.
  }

  return polls.map((poll) => {
    const a = bySlug.get(poll.articleSlug);
    return {
      poll,
      sourceHref: a ? articleHref(a) : "#",
      sourceTitle: a?.title ?? "",
      sourceCategory: a ? categoryName(a.category) : "Jajak Pendapat",
      closed: isPollClosed(poll),
    };
  });
}
