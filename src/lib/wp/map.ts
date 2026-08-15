import "server-only";

import { unstable_cache } from "next/cache";
import type { Article } from "@/lib/types";
import { wpFetchFresh, type WpPost, type WpUser } from "./client";
import { feCategoryFor } from "./rubrik";
import { sanitizeWpHtml } from "./sanitize";
import { cleanExcerpt, cleanText, htmlParagraphs } from "./text";

/**
 * Pemetaan payload WordPress → tipe FE yang sudah ada (Article dkk.),
 * supaya seluruh komponen presentasi tidak perlu berubah.
 */

/* ── Teks: strip tag + decode entity tanpa DOM ─────────────────────── */

// Pindah ke ./text agar bisa dipakai perkakas Node juga (map.ts memuat
// `server-only`). Diekspor ulang supaya pemanggil lama tidak perlu berubah.
export { cleanExcerpt, cleanText, htmlParagraphs } from "./text";

/**
 * Tanggal meta CPT → "YYYY-MM-DD", atau null bila bukan tanggal sah.
 * Field ini diisi lewat kotak Custom Fields teks bebas, jadi "17 Januari
 * 2024" atau tanggal yang tak pernah ada bisa lolos ke REST; formatDate()
 * di FE menempelkan "T00:00:00" ke apa pun yang diterimanya dan akan
 * menampilkan "Invalid Date". Awalan waktu ("2024-01-17 10:00") dipotong,
 * selebihnya ditolak agar pemanggil bisa jatuh ke tanggal terbit pos.
 */
export function isoDate(value: string | undefined): string | null {
  const m = (value ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ]|$)/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const tanggal = `${y}-${mo}-${d}`;
  // Menolak 2026-02-30 dkk.: Date menormalkannya diam-diam ke bulan depan.
  const parsed = new Date(`${tanggal}T00:00:00Z`);
  return parsed.toISOString().slice(0, 10) === tanggal ? tanggal : null;
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function wordCount(text: string): number {
  return text ? text.split(/\s+/).length : 0;
}

/* ── Penulis: user WP ⇄ slug penulis FE (src/data/authors.ts) ──────── */

/**
 * "writer" adalah akun kolektif → profil Redaksi TGR. "m-arief-pranoto"
 * ada di roster FE tetapi tidak punya user WordPress (tulisannya diunggah
 * lewat akun lain — masih dikonfirmasi ke redaksi), jadi tidak ada di sini.
 */
const WP_USER_TO_FE: Record<string, string> = {
  hendrajit: "hendrajit",
  rusman: "rusman",
  yudikobo: "yudi-kobo",
  writer: "redaksi",
};

export const wpUsers = unstable_cache(
  async (): Promise<WpUser[]> =>
    wpFetchFresh<WpUser[]>("/users", {
      query: { per_page: 100, _fields: "id,slug,name" },
    }),
  ["wp-users"],
  { revalidate: 86400, tags: ["wp:users"] }
);

/** ID user WP → slug penulis FE (murni); tak dikenal → profil Redaksi. */
export function feAuthorFromUsers(users: WpUser[], wpUserId: number): string {
  const slug = users.find((u) => u.id === wpUserId)?.slug;
  return (slug && WP_USER_TO_FE[slug]) || "redaksi";
}

/** Slug penulis FE → ID user WP (untuk ?author=…); null bila tak punya akun. */
export async function wpUserIdFor(feSlug: string): Promise<number | null> {
  const wpSlug = Object.entries(WP_USER_TO_FE).find(([, fe]) => fe === feSlug)?.[0];
  if (!wpSlug) return null;
  const users = await wpUsers();
  return users.find((u) => u.slug === wpSlug)?.id ?? null;
}

/* ── Post → Article ────────────────────────────────────────────────── */

function featuredImageUrl(post: WpPost): string | undefined {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!media) return undefined;
  return media.media_details?.sizes?.large?.source_url ?? media.source_url;
}

/**
 * withBody: true hanya untuk halaman detail — menyertakan bodyHtml
 * tersanitasi + body polos per paragraf (fallback render lama).
 * Mode daftar membuang isi setelah menghitung readMinutes agar payload
 * RSC ke browser tetap ringan (rubrik terbesar 910 post).
 *
 * category/imageUrl/users bisa disuplai pemanggil (mode daftar tanpa
 * _embed, yang me-resolve term/media/user SEKALI per daftar — panggilan
 * unstable_cache bersarang di Next 16 selalu mengeksekusi ulang callback,
 * jadi resolusi per-post akan jadi 2N request nyata); tanpa itu semuanya
 * dibaca dari _embedded + cache users (mode detail, di luar unstable_cache).
 */
export async function wpPostToArticle(
  post: WpPost,
  {
    withBody = false,
    category,
    imageUrl,
    users,
  }: {
    withBody?: boolean;
    category?: string;
    imageUrl?: string;
    users?: WpUser[];
  } = {}
): Promise<Article> {
  const contentHtml = post.content?.rendered ?? "";
  const contentText = cleanText(contentHtml);
  const excerpt = truncateWords(
    cleanExcerpt(post.excerpt?.rendered ?? "") || truncateWords(contentText, 35),
    40
  );

  const article: Article = {
    slug: post.slug,
    title: cleanText(post.title.rendered),
    excerpt,
    category: category ?? feCategoryFor(post._embedded?.["wp:term"]?.[0] ?? []),
    author: feAuthorFromUsers(users ?? (await wpUsers()), post.author),
    // formatDate() menambahkan "T00:00:00" sendiri — wajib tanggal saja.
    date: post.date.slice(0, 10),
    dateTime: post.date,
    imageSeed: post.slug,
    imageUrl: imageUrl ?? featuredImageUrl(post),
    body: [],
    readMinutes: Math.max(1, Math.round(wordCount(contentText) / 200)),
    featured: post.sticky === true || undefined,
    highlight: post.meta?.tgr_sorotan || undefined,
  };

  if (withBody) {
    const safe = sanitizeWpHtml(contentHtml);
    article.bodyHtml = safe;
    article.body = htmlParagraphs(safe);

    // Excerpt otomatis WordPress = potongan awal konten. Menampilkannya
    // sebagai lead di halaman detail berarti paragraf pertama tampil dua
    // kali — kosongkan agar lead hanya muncul bila redaksi menulis
    // ringkasan sendiri (halaman & metadata punya fallback masing-masing).
    const excerptStart = normalizeForCompare(excerpt, 12);
    const contentStart = normalizeForCompare(contentText, 12);
    if (excerptStart && excerptStart === contentStart) {
      article.excerpt = "";
    }
  }

  return article;
}

/** N kata pertama, huruf kecil, tanpa tanda baca — untuk deteksi duplikasi. */
function normalizeForCompare(text: string, words: number): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, words)
    .join(" ");
}
