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
  return categoryNames[slug] ?? slug;
}

export function categoryHref(slug: string): string {
  return `/category/${slug}`;
}

export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Mengikuti permalink WordPress produksi: /{slug}/ di akar domain. */
export function articleHref(article: Article): string {
  return `/${article.slug}`;
}

export function articleImage(article: Article, w = 800, h = 500): string {
  return (
    article.imageUrl ?? `https://picsum.photos/seed/${article.imageSeed}/${w}/${h}`
  );
}

/** Estimasi waktu baca dalam menit (≈200 kata/menit). */
export function readingMinutes(article: Article): number {
  if (article.readMinutes) return article.readMinutes;
  const words = [article.excerpt, ...article.body].join(" ").trim().split(/\s+/)
    .length;
  return Math.max(1, Math.round(words / 200));
}
