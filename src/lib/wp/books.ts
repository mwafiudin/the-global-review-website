import "server-only";

import { unstable_cache } from "next/cache";
import { type Book } from "@/data/books";
import { placeholderImage } from "@/lib/articles";
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
 * Koleksi kosong/gagal → [] dan halaman menampilkan keadaan kosong yang
 * jujur — bukan snapshot hardcode yang diam-diam menyimpang dari wp-admin
 * (redaksi menghapus ulasannya, situs terus memajangnya).
 */

interface WpBookPost {
  id: number;
  slug: string;
  date: string;
  title: WpRendered;
  excerpt?: WpRendered;
  content?: WpRendered;
  featured_media?: number;
  /** URL komputasi sisi PHP (mu-plugin ≥3.3) — lihat catatan di articles.ts. */
  tgr_gambar?: string | null;
  tgr_sampul_gambar?: string | null;
  meta?: {
    tgr_buku_judul?: string;
    tgr_buku_penulis?: string;
    tgr_buku_penulis_lengkap?: string;
    tgr_buku_penerbit?: string;
    tgr_buku_tahun?: string;
    tgr_buku_isbn?: string;
    tgr_buku_sampul?: number;
    tgr_buku_podcast?: string;
    tgr_buku_unggulan?: string;
    tgr_buku_karya_gfi?: string;
  };
}

const FIELDS =
  "id,slug,date,title,excerpt,content,featured_media,tgr_gambar,tgr_sampul_gambar,meta";

/**
 * Sampul buku, urut prioritas: unggahan khusus → gambar unggulan →
 * pengganti. URL komputasi PHP menang atas batch /media — batch itu
 * menghilangkan lampiran yang tersembunyi dari REST anonim tanpa galat.
 */
function coverUntuk(item: WpBookPost, media: Map<number, string>): string {
  const khusus = item.meta?.tgr_buku_sampul;
  if (item.tgr_sampul_gambar) return item.tgr_sampul_gambar;
  if (khusus && media.has(khusus)) return media.get(khusus)!;
  if (item.tgr_gambar) return item.tgr_gambar;
  if (item.featured_media && media.has(item.featured_media)) {
    return media.get(item.featured_media)!;
  }
  return placeholderImage(item.slug, 816, 1088);
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
    unggulan: item.meta?.tgr_buku_unggulan === "1",
    karyaGfi: item.meta?.tgr_buku_karya_gfi === "1",
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
    // Hanya untuk pos yang URL komputasinya kosong (mu-plugin belum ≥3.3);
    // begitu field-nya hidup, permintaan ini hilang sama sekali.
    const idMedia = [
      ...new Set(
        items.flatMap((i) =>
          [
            i.tgr_sampul_gambar ? 0 : (i.meta?.tgr_buku_sampul ?? 0),
            i.tgr_gambar ? 0 : (i.featured_media ?? 0),
          ].filter((n) => n > 0)
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

/** Semua ulasan, terbaru dulu; kategori kosong/gagal → []. */
export async function wpBooks(): Promise<Book[]> {
  return dedup("books", async () => {
    try {
      return await cachedBooks();
    } catch (err) {
      // Kegagalan harus terlihat DAN jujur: menyajikan snapshot hardcode
      // membuat wp-admin dan situs menampilkan isi yang berbeda tanpa jejak.
      console.error("[wp] bedah buku gagal dibaca:", err);
      return [];
    }
  });
}

/** Satu ulasan berdasarkan slug. */
export async function wpBook(slug: string): Promise<Book | undefined> {
  return (await wpBooks()).find((b) => b.slug === slug);
}

/**
 * Buku untuk kartu "Buku pilihan" sidebar: yang dicentang redaksi di
 * wp-admin (tunggal-aktif), atau ulasan terbaru bila belum ada yang
 * dicentang; undefined bila koleksinya kosong (kartunya tidak dirender).
 */
export async function bukuPilihan(): Promise<Book | undefined> {
  const daftar = await wpBooks();
  return daftar.find((b) => b.unggulan) ?? daftar[0];
}

/**
 * Buku karya pengkaji GFI, untuk halaman /pustaka-gfi dan seksinya di
 * beranda. Terbitan terbaru dulu — koleksi ini soal karya, bukan kabar,
 * jadi tahun terbit lebih bermakna ketimbang tanggal tayang ulasannya.
 * Buku tanpa tahun ditaruh di belakang, bukan dibuang.
 *
 * Kosong selama redaksi belum mencentang "Karya GFI" di wp-admin (butuh
 * mu-plugin ≥3.4.0); halaman dan seksinya menampilkan keadaan kosong,
 * bukan menebak lewat nama penerbit — Neo Kolonialisme terbit lewat
 * Indonesia Consulting Group dan tetap karya GFI, jadi saringan penerbit
 * akan salah.
 */
export async function pustakaGfi(): Promise<Book[]> {
  const daftar = (await wpBooks()).filter((b) => b.karyaGfi);
  return daftar.sort((a, b) => {
    const ta = Number(a.tahun) || 0;
    const tb = Number(b.tahun) || 0;
    return tb - ta;
  });
}
