import "server-only";

import { unstable_cache } from "next/cache";
import { books as bukuContoh, type Book } from "@/data/books";
import {
  dedup,
  wpFetchAllFresh,
  wpFetchByIdsFresh,
  type WpRendered,
} from "./client";
import { withArchive } from "./articles";
import { cleanExcerpt, cleanText, htmlParagraphs } from "./map";
import { wpCategoryIds } from "./rubrik";

/**
 * Bedah Buku dibaca dari kategori `bedah-buku` di WordPress, bukan dari
 * tipe konten tersendiri: 32 ulasan sudah terbit sebagai tulisan biasa
 * dengan URL terindeks, dan memindahkannya berarti memutus URL itu.
 * Identitas bukunya (sampul, penerbit, ISBN) menumpang sebagai meta.
 *
 * Selama kategorinya kosong atau WordPress tak terjangkau, halaman jatuh
 * ke `src/data/books.ts` supaya rubriknya tidak pernah tampil kosong.
 */

interface WpBookPost {
  id: number;
  slug: string;
  date: string;
  title: WpRendered;
  excerpt?: WpRendered;
  content?: WpRendered;
  featured_media?: number;
  meta?: {
    tgr_buku_judul?: string;
    tgr_buku_penulis?: string;
    tgr_buku_penulis_lengkap?: string;
    tgr_buku_penerbit?: string;
    tgr_buku_tahun?: string;
    tgr_buku_isbn?: string;
    tgr_buku_sampul?: number;
    tgr_buku_podcast?: string;
  };
}

const FIELDS =
  "id,slug,date,title,excerpt,content,featured_media,meta";

/** Sampul buku, urut prioritas: unggahan khusus → gambar unggulan → seed. */
function coverUntuk(item: WpBookPost, media: Map<number, string>): string {
  const khusus = item.meta?.tgr_buku_sampul;
  if (khusus && media.has(khusus)) return media.get(khusus)!;
  if (item.featured_media && media.has(item.featured_media)) {
    return media.get(item.featured_media)!;
  }
  return `https://picsum.photos/seed/${item.slug}/816/1088`;
}

const teksMeta = (nilai: string | undefined): string | undefined =>
  nilai?.trim() ? nilai.trim() : undefined;

export function wpPostToBook(
  item: WpBookPost,
  media: Map<number, string>
): Book {
  const judulPos = cleanText(item.title.rendered);
  const ulasan = htmlParagraphs(item.content?.rendered ?? "");
  const ringkasan = cleanExcerpt(item.excerpt?.rendered ?? "");

  return {
    slug: item.slug,
    // Judul buku boleh berbeda dari judul ulasannya; bila tidak diisi,
    // judul tulisan yang dipakai.
    judul: teksMeta(item.meta?.tgr_buku_judul) ?? judulPos,
    penulis: teksMeta(item.meta?.tgr_buku_penulis) ?? "Redaksi",
    penulisLengkap: teksMeta(item.meta?.tgr_buku_penulis_lengkap),
    penerbit: teksMeta(item.meta?.tgr_buku_penerbit) ?? "",
    tahun: teksMeta(item.meta?.tgr_buku_tahun),
    isbn: teksMeta(item.meta?.tgr_buku_isbn),
    cover: coverUntuk(item, media),
    ringkasan: ringkasan || ulasan[0] || "",
    ulasan,
    podcastTerkait: teksMeta(item.meta?.tgr_buku_podcast),
  };
}

const cachedBooks = unstable_cache(
  async (): Promise<Book[]> => {
    const ids = await wpCategoryIds("bedah-buku");
    if (ids.length === 0) return [];

    const items = await wpFetchAllFresh<WpBookPost>("/posts", {
      // Lewat withArchive() supaya batas arsip berlaku sama seperti rubrik
      // lain, bukan aturan tersendiri yang bisa menyimpang diam-diam.
      query: withArchive({ categories: ids.join(","), _fields: FIELDS }),
    });
    if (items.length === 0) return [];

    // Sampul & gambar unggulan diambil sekali sebagai satu permintaan
    // batch, bukan satu per buku — host ini menolak permintaan beruntun.
    const idMedia = [
      ...new Set(
        items.flatMap((i) =>
          [i.meta?.tgr_buku_sampul ?? 0, i.featured_media ?? 0].filter(
            (n) => n > 0
          )
        )
      ),
    ];
    const berkas = idMedia.length
      ? await wpFetchByIdsFresh<{ id: number; source_url: string }>(
          "/media",
          idMedia,
          { query: { _fields: "id,source_url" } }
        )
      : [];
    const media = new Map(berkas.map((m) => [m.id, m.source_url]));

    return items
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((item) => wpPostToBook(item, media));
  },
  ["wp-books"],
  // Ditandai wp:posts, bukan tag tersendiri: ulasan buku adalah tulisan
  // biasa, jadi webhook penyuntingan sudah menggugurkannya.
  { revalidate: 300, tags: ["wp:posts"] }
);

/** Semua ulasan, terbaru dulu; kategori kosong/gagal → data contoh. */
export async function wpBooks(): Promise<Book[]> {
  return dedup("books", async () => {
    try {
      const items = await cachedBooks();
      if (items.length > 0) return items;
    } catch (err) {
      console.error("[wp] bedah buku gagal dibaca, memakai data contoh:", err);
    }
    return bukuContoh;
  });
}

/** Satu ulasan berdasarkan slug. */
export async function wpBook(slug: string): Promise<Book | undefined> {
  return (await wpBooks()).find((b) => b.slug === slug);
}
