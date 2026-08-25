import "server-only";

import { unstable_cache } from "next/cache";
import { wpFetchAllFresh, type WpCategory, type WpTerm } from "./client";

/**
 * Peta kategori WordPress → rubrik FE (kunci categoryNames di
 * src/data/site.ts).
 *
 * Sejak penataan rubrik dijalankan (wordpress/rest/rubrik.mjs, 15 Agu 2026)
 * struktur WordPress sudah sama dengan struktur situs, jadi hampir seluruh
 * baris di bawah 1:1 — slug yang sama di kedua sisi. Yang tersisa hanya
 * anak-anak rubrik yang di situs tidak punya halaman sendiri.
 *
 * Urutan baris = prioritas saat satu post punya beberapa kategori:
 * jalur terdalam menang; bila kedalaman seri, baris lebih atas menang.
 * Kategori di luar tabel ini memakai slug-nya sendiri sebagai rubrik
 * (lihat feCategoryFor) — jalankan `node wordpress/rest/periksa-rubrik.mjs`
 * untuk menemukannya.
 */
const WP_TO_FE: ReadonlyArray<readonly [wpSlug: string, fePath: string]> = [
  // Sub-rubrik internasional (terdalam, prioritas tertinggi)
  ["asia-tenggara", "internasional/asia-tenggara"],
  ["asia-timur", "internasional/asia-timur"],
  ["asia-selatan", "internasional/asia-selatan"],
  ["asia-tengah", "internasional/asia-tengah"],
  ["australia", "internasional/australia"],
  ["timur-tengah", "internasional/timur-tengah"],
  ["afrika", "internasional/afrika"],
  ["amerika-latin", "internasional/amerika-latin"],

  // Rubrik utama — slug identik di kedua sisi
  ["analisis", "analisis"],
  ["internasional", "internasional"],
  ["geopolitik", "geopolitik"],
  ["politik-keamanan", "politik-keamanan"],
  ["ekonomi-bisnis", "ekonomi-bisnis"],
  ["diplomasi", "diplomasi"],
  ["hukum", "hukum"],
  ["sosial", "sosial"],
  ["budaya", "budaya"],
  ["lingkungan-hidup", "lingkungan-hidup"],
  ["sains-teknologi", "sains-teknologi"],
  ["kesehatan", "kesehatan"],
  ["sorot-tokoh", "sorot-tokoh"],
  ["features", "features"],
  ["media", "media"],
  ["bedah-buku", "bedah-buku"],
  ["komentar-pembaca", "komentar-pembaca"],

  // Anak rubrik di WordPress yang di situs tidak punya halaman sendiri —
  // artikelnya tampil di bawah rubrik induknya.
  ["militer", "politik-keamanan"],
  ["intelijen", "politik-keamanan"],
  ["kejahatan-transnasional", "politik-keamanan"],
  ["kebijakan", "ekonomi-bisnis"],
  ["keuangan", "ekonomi-bisnis"],
  ["migas-dan-pertambangan", "ekonomi-bisnis"],

  // Kawasan lama yang menunggu pemilahan redaksi: "asia" akan dipecah ke
  // Asia Timur/Selatan/Tengah, sementara Amerika dan Eropa belum punya
  // rubrik sendiri di situs.
  ["asia", "internasional"], // TODO(editorial)
  ["amerika", "internasional"], // TODO(editorial)
  ["eropa", "internasional"], // TODO(editorial)
];

const WP_TO_FE_MAP = new Map(WP_TO_FE.map(([wp, fe]) => [wp, fe]));

function depth(fePath: string): number {
  return fePath.split("/").length;
}

/**
 * Tentukan rubrik FE sebuah post dari daftar term kategorinya.
 *
 * Kategori yang belum ada di tabel (redaksi membuat kategori baru di
 * wp-admin) memakai slug-nya sendiri sebagai rubrik, dengan prioritas
 * paling rendah. Sebelumnya kategori semacam itu diabaikan dan artikelnya
 * dilabeli "Analisis" — pembaca diberi rubrik yang salah tanpa jejak apa
 * pun. Rubrik apa adanya lebih jujur: label memakai nama slug, halaman
 * /category/{slug} tetap terbuka, hanya belum masuk menu.
 */
export function feCategoryFor(terms: WpTerm[]): string {
  let best: { fePath: string; order: number } | undefined;
  for (const term of terms) {
    if (term.taxonomy !== "category") continue;
    const terpetakan = WP_TO_FE_MAP.get(term.slug);
    if (!terpetakan) {
      console.warn(`[wp] kategori tak terpetakan: ${term.slug}`);
    }
    const fePath = terpetakan ?? term.slug;
    const order = terpetakan
      ? WP_TO_FE.findIndex(([wp]) => wp === term.slug)
      : WP_TO_FE.length;
    if (
      !best ||
      depth(fePath) > depth(best.fePath) ||
      (depth(fePath) === depth(best.fePath) && order < best.order)
    ) {
      best = { fePath, order };
    }
  }
  return best?.fePath ?? "analisis";
}

/**
 * Seperti feCategoryFor, tapi dari daftar ID term (mode daftar tanpa
 * _embed). Murni: daftar kategori disuplai pemanggil, SEKALI per daftar —
 * unstable_cache bersarang selalu mengeksekusi ulang callback, jadi
 * mengambil kategori per-post berarti N request nyata.
 */
export function feCategoryForIds(ids: number[], categories: WpCategory[]): string {
  if (ids.length === 0) return "analisis";
  const terms: WpTerm[] = [];
  for (const id of ids) {
    const cat = categories.find((c) => c.id === id);
    if (cat) {
      terms.push({ id: cat.id, slug: cat.slug, name: cat.name, taxonomy: "category" });
    }
  }
  return feCategoryFor(terms);
}

/** Slug WP yang tercakup sebuah jalur FE, termasuk turunannya (prefix match). */
function wpSlugsFor(fePath: string): string[] {
  return WP_TO_FE.filter(
    ([, fe]) => fe === fePath || fe.startsWith(`${fePath}/`)
  ).map(([wp]) => wp);
}

/**
 * Daftar kategori WP (id, slug, …) — di-cache sehari, tag wp:categories
 * (digugurkan webhook mu-plugin ≥1.2 saat kategori ditata). Halaman demi
 * halaman: satu permintaan per_page=100 terpotong DIAM-DIAM di kategori
 * ke-101, dan kategori yang tak terbaca membuat artikelnya berpindah rubrik
 * tanpa jejak (feCategoryForIds jatuh ke "analisis").
 */
export const wpCategories = unstable_cache(
  async (): Promise<WpCategory[]> =>
    wpFetchAllFresh<WpCategory>("/categories", {
      query: { _fields: "id,slug,name,parent,count" },
    }),
  ["wp-categories"],
  { revalidate: 86400, tags: ["wp:categories"] }
);

/**
 * ID term WP untuk sebuah jalur rubrik FE (dipakai sebagai ?categories=…).
 * Resolusi slug→id dilakukan runtime; tabel di atas sudah memuat slug lama
 * DAN slug tujuan 04-rubrik.sh, jadi migrasi rubrik tidak mematahkan peta —
 * tetap perbarui tabel ini begitu redaksi memutuskan nasib baris TINJAU.
 */
export async function wpCategoryIds(fePath: string): Promise<number[]> {
  const wanted = new Set(wpSlugsFor(fePath));
  // Rubrik di luar tabel (kategori baru buatan redaksi) tetap punya
  // halaman: jalurnya dicocokkan langsung dengan slug WordPress.
  if (wanted.size === 0) wanted.add(fePath);
  const categories = await wpCategories();
  return categories.filter((c) => wanted.has(c.slug)).map((c) => c.id);
}
