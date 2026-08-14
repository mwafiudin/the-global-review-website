import "server-only";

import { unstable_cache } from "next/cache";
import { albums as contohAlbums, type Album, type Photo } from "@/data/gallery";
import {
  dedup,
  wpFetchAllFresh,
  wpFetchByIdsFresh,
  type WpRendered,
} from "./client";
import { cleanExcerpt, cleanText, isoDate } from "./map";

/**
 * Album galeri dari CPT tgr_album (rest_base: albums). Isi album adalah
 * daftar ID lampiran (meta tgr_foto); caption tiap foto diambil dari field
 * caption lampiran itu sendiri di Media Library. Koleksi kosong/gagal →
 * data contoh src/data/gallery.ts, sama seperti podcast.
 */

interface WpAlbum {
  slug: string;
  date: string;
  title: WpRendered;
  excerpt?: WpRendered;
  meta?: {
    tgr_lokasi?: string;
    tgr_tanggal?: string;
    tgr_foto?: number[];
    /** Label kategori album, mis. "Seminar" (mu-plugin ≥1.1). */
    tgr_kategori?: string;
  };
}

interface WpAttachment {
  id: number;
  source_url?: string;
  alt_text?: string;
  caption?: WpRendered;
  media_details?: { sizes?: { large?: { source_url?: string } } };
}

/** ID lampiran → Photo; lampiran tanpa URL dilewati. */
export function wpAttachmentToPhoto(media: WpAttachment): Photo | null {
  const src = media.media_details?.sizes?.large?.source_url ?? media.source_url;
  if (!src) return null;
  return {
    seed: String(media.id),
    caption: cleanText(media.caption?.rendered ?? "") || media.alt_text || "",
    src,
  };
}

/** Album tanpa satu pun foto ter-resolve tidak dirender (kartu butuh sampul). */
export function wpAlbumToAlbum(item: WpAlbum, foto: Photo[]): Album | null {
  if (!item.slug || foto.length === 0) return null;
  return {
    slug: item.slug,
    judul: cleanText(item.title.rendered),
    kategori: item.meta?.tgr_kategori?.trim() || "Kegiatan",
    tanggal: isoDate(item.meta?.tgr_tanggal) ?? item.date.slice(0, 10),
    lokasi: item.meta?.tgr_lokasi?.trim() || "Jakarta",
    ringkasan: cleanExcerpt(item.excerpt?.rendered ?? ""),
    foto,
  };
}

/**
 * ID lampiran sama bisa masuk dua kali (tgr_foto diisi manual) — foto
 * kembar memakai key React yang sama, jadi disaring di sini.
 */
function fotoAlbum(ids: number[], byId: Map<number, Photo>): Photo[] {
  return [...new Set(ids)]
    .map((id) => byId.get(id))
    .filter((f): f is Photo => f !== undefined);
}

const cachedAlbums = unstable_cache(
  async (): Promise<Album[]> => {
    const items = await wpFetchAllFresh<WpAlbum>("/albums", {
      query: { _fields: "slug,date,title,excerpt,meta" },
    });

    // Satu batch untuk seluruh foto semua album (dipotong per 100 ID).
    const media = await wpFetchByIdsFresh<WpAttachment>(
      "/media",
      items.flatMap((a) => a.meta?.tgr_foto ?? []),
      { query: { _fields: "id,source_url,alt_text,caption,media_details" } }
    );
    const photoById = new Map<number, Photo>();
    for (const m of media) {
      const photo = wpAttachmentToPhoto(m);
      if (photo) photoById.set(m.id, photo);
    }

    return items
      .map((item) => wpAlbumToAlbum(item, fotoAlbum(item.meta?.tgr_foto ?? [], photoById)))
      .filter((a): a is Album => a !== null)
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  },
  ["wp-albums"],
  { revalidate: 300, tags: ["wp:albums"] }
);

/** Semua album, terbaru dulu; koleksi kosong/gagal → data contoh. */
export async function wpAlbums(): Promise<Album[]> {
  return dedup("albums", async () => {
    try {
      const items = await cachedAlbums();
      if (items.length > 0) return items;
    } catch (err) {
      console.error("[wp] album gagal dibaca, memakai data contoh:", err);
    }
    return contohAlbums;
  });
}

/** Satu album berdasarkan slug. */
export async function wpAlbum(slug: string): Promise<Album | undefined> {
  return (await wpAlbums()).find((a) => a.slug === slug);
}
