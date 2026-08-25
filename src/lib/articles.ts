import { categoryNames } from "@/data/site";
import { Article } from "./types";

/**
 * Helper murni seputar artikel — sengaja tetap sinkron dan bebas fetch
 * karena juga diimpor komponen client (Search, CategoryBrowser, dst.).
 * Pengambilan data dari WordPress ada di src/lib/wp/articles.ts.
 */

/** Cocokkan kategori termasuk turunannya: "hankam" mencakup "hankam/militer". */
export function inCategory(article: Article, categorySlug: string): boolean {
  return (
    article.category === categorySlug ||
    article.category.startsWith(categorySlug + "/")
  );
}

export function categoryName(slug: string): string {
  const terdaftar = categoryNames[slug];
  if (terdaftar) return terdaftar;
  // Rubrik di luar daftar — kategori baru yang dibuat redaksi di wp-admin
  // sebelum sempat didaftarkan di sini. Slug-nya dirapikan jadi teks yang
  // layak baca alih-alih tampil mentah sebagai "sains-teknologi".
  const akhir = slug.split("/").pop() ?? slug;
  return akhir
    .split("-")
    .filter(Boolean)
    .map((kata) => kata.charAt(0).toUpperCase() + kata.slice(1))
    .join(" ");
}

export function categoryHref(slug: string): string {
  return `/category/${slug}`;
}

/**
 * Format tanggal per bahasa. en-GB dipilih (bukan en-US) supaya urutan
 * hari-bulan-tahun sama dengan id-ID dan layout kartu tidak bergeser.
 */
export function formatDate(iso: string, lang: "id" | "en" = "id"): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(
    lang === "en" ? "en-GB" : "id-ID",
    { day: "numeric", month: "long", year: "numeric" }
  );
}

/** Mengikuti permalink WordPress produksi: /{slug}/ di akar domain. */
export function articleHref(article: Article): string {
  return `/${article.slug}`;
}

/**
 * Gambar pengganti saat artikel tak punya gambar unggulan atau gagal
 * ter-resolve: aset brand lokal, bukan foto stok acak — foto acak tampil
 * seolah foto editorial dan menyesatkan pembaca. Pemakaiannya dicatat agar
 * tidak lagi senyap. Rasio dari w/h memilih aset: potret untuk sampul buku,
 * lanskap untuk artikel. (seed/w/h dipertahankan di tanda tangan supaya
 * call site tidak berubah bila strategi penggantinya diganti lagi.)
 */
export function placeholderImage(seed: string, w = 800, h = 500): string {
  console.warn(`[artikel] gambar pengganti dipakai untuk "${seed}" (${w}×${h})`);
  return h > w
    ? "/images/tekstur-kertas-editorial.jpg"
    : "/images/peta-dunia-engraving-antik.jpg";
}

export function articleImage(article: Article, w = 800, h = 500): string {
  return article.imageUrl ?? placeholderImage(article.imageSeed, w, h);
}

/**
 * Lipat variasi wptexturize (kutip keriting, dash panjang, ellipsis) plus
 * kapitalisasi — pemetaan 1 huruf : 1 huruf, jadi posisi hasil pencocokan
 * pada teks terlipat tetap sah untuk memotong teks aslinya. Cermin
 * tgr_sorotan_lipat() di mu-plugin.
 */
function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[“”„«»]/g, '"')
    .replace(/[‘’‚]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, ".");
}

/**
 * Pecah judul pada kemunculan PERTAMA frasa sorotan; null bila frasa
 * kosong/tak ditemukan. indexOf, bukan String.split: frasa yang kebetulan
 * muncul dua kali di judul tidak boleh membuang ekor judul diam-diam.
 *
 * match = potongan judul ASLINYA (bukan frasa tersimpan): judul rendered
 * membawa kutip keriting hasil wptexturize sedangkan frasa dari wp-admin
 * mentah — pencocokan kedua dilakukan pada bentuk terlipat, dan yang
 * dirender harus glyph judul apa adanya.
 */
export function splitHighlight(
  title: string,
  highlight?: string
): { before: string; match: string; after: string } | null {
  if (!highlight) return null;
  let i = title.indexOf(highlight);
  if (i === -1) {
    i = normalizeForMatch(title).indexOf(normalizeForMatch(highlight));
    if (i === -1) return null;
  }
  return {
    before: title.slice(0, i),
    match: title.slice(i, i + highlight.length),
    after: title.slice(i + highlight.length),
  };
}

/** Estimasi waktu baca dalam menit (≈200 kata/menit). */
export function readingMinutes(article: Article): number {
  if (article.readMinutes) return article.readMinutes;
  const words = [article.excerpt, ...article.body].join(" ").trim().split(/\s+/)
    .length;
  return Math.max(1, Math.round(words / 200));
}
