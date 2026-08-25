import "server-only";

import { unstable_cache } from "next/cache";
import { type Podcast } from "@/data/podcasts";
import { dedup, wpFetchAllFresh, type WpRendered } from "./client";
import { cleanExcerpt, cleanText, htmlParagraphs, isoDate } from "./map";

/**
 * Podcast dari CPT tgr_podcast (rest_base: podcasts). Koleksi kosong/gagal
 * → [] dan halaman menampilkan keadaan kosong yang jujur — bukan snapshot
 * hardcode yang diam-diam menyimpang dari wp-admin (redaksi menarik semua
 * penampilan, situs terus memajangnya).
 */

interface WpPodcast {
  slug: string;
  date: string;
  title: WpRendered;
  excerpt?: WpRendered;
  content?: WpRendered;
  meta?: {
    tgr_kanal?: string;
    tgr_narasumber?: string;
    tgr_format?: string;
    tgr_video_id?: string;
    tgr_tayang?: string;
    /** "1" bila dicentang sebagai penampilan utama (mu-plugin ≥1.1). */
    tgr_unggulan?: string;
  };
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * tgr_video_id diinterpolasi ke URL embed & thumbnail, jadi bentuknya
 * dikunci ke ID YouTube 11 karakter. Redaksi yang menempel URL penuh
 * (youtu.be/…, watch?v=…, /embed/…, shorts/…) tetap kita terima —
 * ID-nya diekstrak; selain itu ditolak.
 */
export function parseYoutubeId(value: string): string | null {
  const v = value.trim();
  if (YT_ID.test(v)) return v;
  const m = v.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

/**
 * Penampilan tanpa video tidak bisa dirender (kartu memakai thumbnail
 * YouTube), jadi disaring — kembalikan null alih-alih kartu pecah.
 */
export function wpPodcastToPodcast(item: WpPodcast): Podcast | null {
  const videoId = parseYoutubeId(item.meta?.tgr_video_id ?? "");
  if (!videoId || !item.slug) return null;

  const ringkasan = htmlParagraphs(item.content?.rendered ?? "");
  const excerpt = cleanExcerpt(item.excerpt?.rendered ?? "");

  return {
    slug: item.slug,
    headline: cleanText(item.title.rendered),
    media: item.meta?.tgr_kanal?.trim() || "The Global Review",
    narasumber: item.meta?.tgr_narasumber?.trim() || "Tim GFI",
    format: item.meta?.tgr_format?.trim() || "Podcast",
    tanggal: isoDate(item.meta?.tgr_tayang) ?? item.date.slice(0, 10),
    videoId,
    ringkasan: ringkasan.length > 0 ? ringkasan : excerpt ? [excerpt] : [],
    featured: item.meta?.tgr_unggulan === "1" || undefined,
  };
}

const cachedPodcasts = unstable_cache(
  async (): Promise<Podcast[]> => {
    const items = await wpFetchAllFresh<WpPodcast>("/podcasts", {
      query: { _fields: "slug,date,title,excerpt,content,meta" },
    });
    return items
      .map(wpPodcastToPodcast)
      .filter((p): p is Podcast => p !== null)
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  },
  ["wp-podcasts"],
  { revalidate: 300, tags: ["wp:podcasts"] }
);

/** Semua penampilan, terbaru dulu; koleksi kosong/gagal → []. */
export async function wpPodcasts(): Promise<Podcast[]> {
  return dedup("podcasts", async () => {
    try {
      return await cachedPodcasts();
    } catch (err) {
      // Kegagalan harus terlihat DAN jujur: menyajikan snapshot hardcode
      // membuat wp-admin dan situs menampilkan isi yang berbeda tanpa jejak.
      console.error("[wp] podcast gagal dibaca:", err);
      return [];
    }
  });
}

/** Satu penampilan berdasarkan slug (koleksi kecil — cari dari daftar). */
export async function wpPodcast(slug: string): Promise<Podcast | undefined> {
  return (await wpPodcasts()).find((p) => p.slug === slug);
}
