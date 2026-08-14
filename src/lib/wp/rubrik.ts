import "server-only";

import { unstable_cache } from "next/cache";
import { wpFetchFresh, type WpCategory, type WpTerm } from "./client";

/**
 * Peta 37 kategori WordPress → rubrik FE (kunci categoryNames di
 * src/data/site.ts). Rubrikasi baru belum dieksekusi di WordPress
 * (wordpress/cli/04-rubrik.sh masih menunggu akses & keputusan redaksi),
 * jadi tabel ini menjembatani sementara agar tidak ada artikel yatim.
 *
 * Urutan baris = prioritas saat satu post punya beberapa kategori:
 * jalur terdalam menang; bila kedalaman seri, baris lebih atas menang.
 * Baris TODO(editorial) mengikuti daftar TINJAU di 04-rubrik.sh —
 * setelah redaksi memutuskan dan skrip dijalankan, perbarui tabel ini.
 */
const WP_TO_FE: ReadonlyArray<readonly [wpSlug: string, fePath: string]> = [
  // Sub-rubrik internasional (terdalam, prioritas tertinggi)
  ["asean", "internasional/asia-tenggara"],
  ["timur-tengah", "internasional/timur-tengah"],
  ["afrika", "internasional/afrika"],
  ["amerika-latin", "internasional/amerika-latin"],

  // Rubrik dengan padanan langsung
  ["diplomasi", "diplomasi"],
  ["hukum", "hukum"],
  ["kesehatan", "kesehatan"],
  ["lingkungan-hidup", "lingkungan-hidup"],
  ["sorot-tokoh", "sorot-tokoh"],
  ["media", "media"],
  ["bedah-buku", "bedah-buku"],
  ["iptek", "sains-teknologi"],

  // Gabungan politik-keamanan (mengikuti GABUNG/INDUK di 04-rubrik.sh)
  ["politik", "politik-keamanan"],
  ["hankam", "politik-keamanan"],
  ["militer", "politik-keamanan"],
  ["intelijen", "politik-keamanan"],
  ["kejahatan-transnasional", "politik-keamanan"],

  // Geopolitik dan turunannya
  ["geopolitik", "geopolitik"],
  ["geopolitik-militer", "geopolitik"],
  ["strategi-global", "geopolitik"], // TODO(editorial)

  // Ekonomi & bisnis beserta anak-anaknya
  ["ekonomi-bisnis", "ekonomi-bisnis"],
  ["kebijakan", "ekonomi-bisnis"],
  ["keuangan", "ekonomi-bisnis"],
  ["migas-dan-pertambangan", "ekonomi-bisnis"],

  // KHAZANAH dan anak-anaknya (FE memisah Sosial dan Budaya)
  ["sosial-budaya", "sosial"], // TODO(editorial)
  ["nusantara", "sosial"], // TODO(editorial)
  ["pendidikan", "sosial"], // TODO(editorial)
  ["khazanah", "budaya"], // TODO(editorial)

  // Liputan khusus
  ["sejarah", "features"], // TODO(editorial)
  ["wawancara", "features"], // TODO(editorial)
  ["komentar-pembaca", "features"], // TODO(editorial)

  // Rubrik besar tanpa padanan — sementara ke Analisis
  ["analisis", "analisis"],
  ["kepentingan-nasional", "analisis"], // TODO(editorial)

  // Slug TUJUAN 04-rubrik.sh (GANTI/GABUNG) — belum ada di WP hari ini,
  // dicantumkan sekarang supaya peta tetap benar begitu skrip dijalankan.
  ["sains-teknologi", "sains-teknologi"],
  ["asia-tenggara", "internasional/asia-tenggara"],
  ["politik-keamanan", "politik-keamanan"],

  // Kawasan tanpa rubrik FE sendiri — jatuh ke induk Internasional
  ["amerika", "internasional"], // TODO(editorial): FE hanya punya Amerika Latin
  ["asia", "internasional"], // TODO(editorial): menunggu pemecahan per kawasan
  ["eropa", "internasional"], // TODO(editorial)
  ["internasional", "internasional"],
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

/** Daftar kategori WP (id, slug, …) — di-cache sehari, tag wp:categories. */
export const wpCategories = unstable_cache(
  async (): Promise<WpCategory[]> =>
    wpFetchFresh<WpCategory[]>("/categories", {
      query: { per_page: 100, _fields: "id,slug,name,parent,count" },
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
