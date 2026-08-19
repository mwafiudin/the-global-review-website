import "server-only";

import { unstable_cache } from "next/cache";
import type { Article } from "@/lib/types";
import {
  dedup,
  wpFetch,
  wpFetchAllFresh,
  wpFetchByIdsFresh,
  wpFetchFresh,
  wpFetchFreshWithTotal,
  type WpMediaLite,
  type WpPost,
} from "./client";
import { wpPostToArticle, wpUserIdFor, wpUsers } from "./map";
import { feCategoryForIds, wpCategories, wpCategoryIds } from "./rubrik";

/**
 * Pengakses data artikel dari WordPress — pengganti async untuk fungsi
 * data yang dulu membaca src/data/articles.ts. Helper murni (articleHref,
 * formatDate, dst.) tetap sinkron di src/lib/articles.ts agar komponen
 * client tidak menyeret modul server ini.
 *
 * Strategi cache: daftar 300 dtk (tag wp:posts), detail 3600 dtk
 * (tag wp:post:{slug}); webhook /api/revalidate mengadaluwarsakan tag
 * begitu redaksi menekan simpan di wp-admin.
 *
 * Daftar di-cache lewat unstable_cache SETELAH dipetakan (Article tanpa
 * body ≈ 1 KB/entri). Fetch daftar sengaja TANPA _embed — payload embed
 * (media_details semua ukuran) menggandakan bobot respons jadi 4–8 MB dan
 * sempat memicu rate-limit host; sebagai ganti, term di-resolve dari cache
 * /categories dan gambar lewat satu request batch /media yang ringan.
 */

const EMBED = "wp:featuredmedia,wp:term";
/** Mode detail: butuh _embedded; _links wajib ikut agar _embed jalan. */
const DETAIL_FIELDS =
  "id,slug,date,sticky,author,title,excerpt,content,meta,_links,_embedded";
/** Mode daftar: ID mentah saja untuk media & kategori (jauh lebih ringan). */
const LIST_FIELDS =
  "id,slug,date,sticky,author,title,excerpt,content,meta,featured_media,categories";

const LIST_REVALIDATE = 300;
const DETAIL_REVALIDATE = 3600;
/** Daftar 50–100 post (3–8 MB) bisa lambat di host ini; beri napas lebih. */
const LIST_TIMEOUT_MS = 20000;

type PostsQuery = Record<string, string | number | boolean | undefined>;

function perPage(limit: number): number {
  return Math.min(Math.max(limit, 1), 100);
}

/**
 * Arsip lama: tulisan 2022 ke bawah diarsipkan terpisah ke Google Drive atas
 * arahan GFI dan tidak ditampilkan di situs baru. Ambangnya dibaca dari env
 * supaya bisa digeser tanpa ubah kode; kosongkan untuk menayangkan seluruh
 * arsip lagi.
 */
const ARSIP_SETELAH = process.env.WP_ARCHIVE_AFTER ?? "2022-12-31T23:59:59";

/**
 * Dua pengecualian yang disengaja:
 * - `after` sudah dipakai pemanggil sebagai jangkar (adjacentArticles) — satu
 *   kueri tidak bisa punya dua batas bawah.
 * - Pencarian `slug` adalah rujukan eksplisit ke tulisan tertentu (kartu jajak
 *   pendapat), bukan penelusuran arsip.
 */
export function withArchive(query: PostsQuery): PostsQuery {
  if (!ARSIP_SETELAH || query.after !== undefined || query.slug !== undefined) {
    return query;
  }
  return { after: ARSIP_SETELAH, ...query };
}

function listQuery(query: PostsQuery): PostsQuery {
  return { _fields: LIST_FIELDS, ...withArchive(query) };
}

/** URL gambar unggulan per attachment, satu request batch untuk satu daftar. */
async function featuredImageMap(posts: WpPost[]): Promise<Map<number, string>> {
  const ids = posts.map((p) => p.featured_media ?? 0);
  const map = new Map<number, string>();
  // _fields bersarang (media_details.sizes.…) tidak difilter host ini —
  // minta media_details utuh agar ukuran `large` benar-benar terpakai.
  const media = await wpFetchByIdsFresh<WpMediaLite>("/media", ids, {
    query: { _fields: "id,source_url,media_details" },
  });
  for (const m of media) {
    const url = m.media_details?.sizes?.large?.source_url ?? m.source_url;
    if (url) map.set(m.id, url);
  }
  return map;
}

/**
 * users/categories diambil SEKALI per daftar (bukan per post): panggilan
 * unstable_cache bersarang di Next 16 tidak pernah membaca cache — per-post
 * berarti 2N request nyata ke host yang membatasi burst.
 */
async function mapListPosts(posts: WpPost[]): Promise<Article[]> {
  const [users, categories, images] = await Promise.all([
    wpUsers(),
    wpCategories(),
    featuredImageMap(posts),
  ]);
  return Promise.all(
    posts.map((post) =>
      wpPostToArticle(post, {
        users,
        category: feCategoryForIds(post.categories ?? [], categories),
        imageUrl: post.featured_media ? images.get(post.featured_media) : undefined,
      })
    )
  );
}

/** Argumen ikut menjadi kunci cache, jadi tiap kombinasi query di-cache terpisah. */
const cachedList = unstable_cache(
  async (query: PostsQuery): Promise<Article[]> => {
    const posts = await wpFetchFresh<WpPost[]>("/posts", {
      query: listQuery(query),
      timeoutMs: LIST_TIMEOUT_MS,
    });
    return mapListPosts(posts);
  },
  ["wp-article-list"],
  { revalidate: LIST_REVALIDATE, tags: ["wp:posts"] }
);

const cachedListWithTotal = unstable_cache(
  async (query: PostsQuery): Promise<{ list: Article[]; total: number }> => {
    const { data, total } = await wpFetchFreshWithTotal<WpPost[]>("/posts", {
      query: listQuery(query),
      timeoutMs: LIST_TIMEOUT_MS,
    });
    return { list: await mapListPosts(data), total };
  },
  ["wp-article-list-total"],
  { revalidate: LIST_REVALIDATE, tags: ["wp:posts"] }
);

const cachedCount = unstable_cache(
  async (query: PostsQuery): Promise<number> => {
    const { total } = await wpFetchFreshWithTotal<unknown[]>("/posts", {
      query: { per_page: 1, _fields: "id", ...withArchive(query) },
    });
    return total;
  },
  ["wp-article-count"],
  { revalidate: LIST_REVALIDATE, tags: ["wp:posts"] }
);

const cachedSearch = unstable_cache(
  async (q: string, limit: number): Promise<Article[]> => {
    // search= bawaan menggeledah isi lengkap ±5.700 pos: 5–9 dtk di host
    // ini, kerap melewati batas waktu sehingga panel tampak "tanpa hasil".
    // Kolom judul saja ±0,9 dtk (butuh WP ≥6.2) dan lebih relevan untuk
    // pencarian situs.
    const posts = await wpFetchFresh<WpPost[]>("/posts", {
      query: listQuery({
        search: q,
        search_columns: "post_title",
        per_page: limit,
      }),
    });
    return mapListPosts(posts);
  },
  ["wp-article-search"],
  { revalidate: 60, tags: ["wp:posts"] }
);

const listCached = (query: PostsQuery) =>
  dedup(`list:${JSON.stringify(query)}`, () => cachedList(query));
const listWithTotalCached = (query: PostsQuery) =>
  dedup(`total:${JSON.stringify(query)}`, () => cachedListWithTotal(query));
const countCached = (query: PostsQuery) =>
  dedup(`count:${JSON.stringify(query)}`, () => cachedCount(query));

/** Artikel terbaru lintas rubrik (beranda). */
export async function allArticles(limit = 24): Promise<Article[]> {
  return listCached({ per_page: perPage(limit) });
}

/**
 * Artikel utama: sticky post dulu (redaksi mencentang "Stick to the top of
 * the blog" di wp-admin), sisanya diisi artikel terbaru non-sticky —
 * meniru perilaku featuredArticles pada data dummy.
 */
export async function featuredArticles(limit = 5): Promise<Article[]> {
  const [sticky, latest] = await Promise.all([
    listCached({ sticky: true, per_page: perPage(limit) }),
    listCached({ sticky: false, per_page: perPage(limit) }),
  ]);
  return [...sticky, ...latest].slice(0, limit);
}

/** Satu artikel lengkap (body tersanitasi) berdasarkan slug. */
export async function getArticle(slug: string): Promise<Article | undefined> {
  const posts = await wpFetch<WpPost[]>("/posts", {
    query: { slug, _embed: EMBED, _fields: DETAIL_FIELDS },
    revalidate: DETAIL_REVALIDATE,
    tags: [`wp:post:${slug}`],
  });
  if (posts.length === 0) return undefined;
  return wpPostToArticle(posts[0], { withBody: true });
}

/**
 * Artikel sebuah rubrik FE (termasuk turunannya), terbaru dulu.
 * Dibatasi 100 terbaru — CategoryBrowser memfilter di sisi client, dan
 * mengirim 900+ artikel ke browser bukan pilihan. Header halaman tetap
 * menampilkan jumlah sebenarnya lewat byCategoryWithTotal.
 */
export async function byCategory(fePath: string, limit = 100): Promise<Article[]> {
  const ids = await wpCategoryIds(fePath);
  if (ids.length === 0) return [];
  return listCached({ categories: ids.join(","), per_page: perPage(limit) });
}

/**
 * byCategory + total sebenarnya dari X-WP-Total (untuk "N artikel").
 * page > 1 menarik lembar arsip berikutnya (paginasi /halaman/{n});
 * page 1 sengaja tidak menyertakan parameter agar kunci cache-nya sama
 * dengan sebelum paginasi ada. Nomor di luar rentang membuat WP menjawab
 * 400 (rest_post_invalid_page_number) — pemanggil menerjemahkannya ke 404.
 */
export async function byCategoryWithTotal(
  fePath: string,
  limit = 100,
  page = 1
): Promise<{ list: Article[]; total: number }> {
  const ids = await wpCategoryIds(fePath);
  if (ids.length === 0) return { list: [], total: 0 };
  return listWithTotalCached({
    categories: ids.join(","),
    per_page: perPage(limit),
    ...(page > 1 ? { page } : {}),
  });
}

/** Gabungan beberapa rubrik FE sekaligus (section beranda). */
export async function byCategories(
  fePaths: string[],
  limit = 12
): Promise<Article[]> {
  const idLists = await Promise.all(fePaths.map((p) => wpCategoryIds(p)));
  const ids = [...new Set(idLists.flat())];
  if (ids.length === 0) return [];
  return listCached({ categories: ids.join(","), per_page: perPage(limit) });
}

/**
 * Tulisan seorang penulis FE; penulis tanpa akun WP (mis. m-arief-pranoto)
 * → []. Catatan: parameter dikirim sebagai author[]=… (sintaks array REST)
 * karena aturan nginx host memblokir bentuk ?author=N (anti-enumerasi).
 */
export async function byAuthor(feSlug: string, limit = 50): Promise<Article[]> {
  const id = await wpUserIdFor(feSlug);
  if (id === null) return [];
  return listCached({ "author[]": id, per_page: perPage(limit) });
}

/** Jumlah tulisan seorang penulis (X-WP-Total, tanpa menarik kontennya). */
export async function byAuthorCount(feSlug: string): Promise<number> {
  const id = await wpUserIdFor(feSlug);
  if (id === null) return 0;
  return countCached({ "author[]": id });
}

/**
 * Artikel sebelum (lebih baru) & sesudah (lebih lama) dalam rubrik induk.
 * Dikueri langsung dengan before/after pada waktu terbit — mencari posisi
 * di daftar ber-cap 100 membuat navigasi hilang untuk mayoritas arsip
 * 5.600+ artikel.
 */
export async function adjacentArticles(article: Article): Promise<{
  prev?: Article;
  next?: Article;
}> {
  const parent = article.category.split("/")[0];
  const ids = await wpCategoryIds(parent);
  if (ids.length === 0) return {};
  const anchor = article.dateTime ?? `${article.date}T00:00:00`;
  const base = { categories: ids.join(","), per_page: 1, orderby: "date" };
  const [newer, older] = await Promise.all([
    listCached({ ...base, after: anchor, order: "asc" }),
    listCached({ ...base, before: anchor, order: "desc" }),
  ]);
  return { prev: newer[0], next: older[0] };
}

/**
 * Beberapa artikel sekaligus berdasarkan slug — satu request per 100 slug,
 * bukan satu request detail per artikel (dipakai kartu jajak pendapat yang
 * butuh judul + rubrik sumbernya).
 */
export async function articlesBySlugs(slugs: string[]): Promise<Article[]> {
  const unik = [...new Set(slugs)].filter(Boolean);
  const hasil: Article[] = [];
  for (let i = 0; i < unik.length; i += 100) {
    const bagian = unik.slice(i, i + 100);
    hasil.push(
      ...(await listCached({ slug: bagian.join(","), per_page: bagian.length }))
    );
  }
  return hasil;
}

/** Pencarian judul WordPress (urutan relevansi) untuk /api/search. */
export async function searchArticles(q: string, limit = 8): Promise<Article[]> {
  return dedup(`search:${q}:${limit}`, () => cachedSearch(q, perPage(limit)));
}

/** Entri ringan untuk sitemap: slug + waktu ubah terakhir (UTC). */
export interface ArticleSitemapEntry {
  slug: string;
  modifiedGmt?: string;
}

/**
 * SELURUH slug artikel tayang untuk sitemap.xml — ±9 halaman × 100 untuk
 * arsip pasca-2022, tapi maxPages diberi ruang sampai skala penuh 5.700
 * tulisan bila WP_ARCHIVE_AFTER suatu saat dikosongkan. Hanya dua kolom
 * yang diminta, jadi bobotnya jauh di bawah daftar biasa.
 */
const cachedSitemapSlugs = unstable_cache(
  async (): Promise<ArticleSitemapEntry[]> => {
    const posts = await wpFetchAllFresh<{ slug: string; modified_gmt?: string }>(
      "/posts",
      {
        query: { _fields: "slug,modified_gmt", ...withArchive({}) },
        timeoutMs: LIST_TIMEOUT_MS,
        maxPages: 60,
      }
    );
    return posts.map((p) => ({ slug: p.slug, modifiedGmt: p.modified_gmt }));
  },
  ["wp-sitemap-slugs"],
  { revalidate: 3600, tags: ["wp:posts"] }
);

export async function articleSitemapEntries(): Promise<ArticleSitemapEntry[]> {
  return dedup("sitemap-slugs", () => cachedSitemapSlugs());
}
