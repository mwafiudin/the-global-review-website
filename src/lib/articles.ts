import { articles } from "@/data/articles";
import { categoryNames } from "@/data/site";
import { Article } from "./types";

export function allArticles(): Article[] {
  return [...articles].sort((a, b) => b.date.localeCompare(a.date));
}

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

/** Cocokkan kategori termasuk turunannya: "hankam" mencakup "hankam/militer". */
export function inCategory(article: Article, categorySlug: string): boolean {
  return (
    article.category === categorySlug ||
    article.category.startsWith(categorySlug + "/")
  );
}

export function byCategory(categorySlug: string, limit?: number): Article[] {
  const list = allArticles().filter((a) => inCategory(a, categorySlug));
  return limit ? list.slice(0, limit) : list;
}

export function byAuthor(slug: string, limit?: number): Article[] {
  const list = allArticles().filter((a) => a.author === slug);
  return limit ? list.slice(0, limit) : list;
}

export function byCategories(slugs: string[], limit?: number): Article[] {
  const list = allArticles().filter((a) =>
    slugs.some((s) => inCategory(a, s))
  );
  return limit ? list.slice(0, limit) : list;
}

export function featuredArticles(limit = 5): Article[] {
  const featured = allArticles().filter((a) => a.featured);
  const rest = allArticles().filter((a) => !a.featured);
  return [...featured, ...rest].slice(0, limit);
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

export function articleHref(article: Article): string {
  return `/artikel/${article.slug}`;
}

export function articleImage(article: Article, w = 800, h = 500): string {
  return `https://picsum.photos/seed/${article.imageSeed}/${w}/${h}`;
}

/** Estimasi waktu baca dalam menit (≈200 kata/menit). */
export function readingMinutes(article: Article): number {
  const words = [article.excerpt, ...article.body].join(" ").trim().split(/\s+/)
    .length;
  return Math.max(1, Math.round(words / 200));
}

/** Artikel sebelumnya (lebih baru) & selanjutnya (lebih lama) dalam rubrik induk. */
export function adjacentArticles(article: Article): {
  prev?: Article;
  next?: Article;
} {
  const parent = article.category.split("/")[0];
  const list = byCategory(parent); // sudah terurut terbaru → terlama
  const i = list.findIndex((a) => a.slug === article.slug);
  if (i === -1) return {};
  return { prev: list[i - 1], next: list[i + 1] };
}
