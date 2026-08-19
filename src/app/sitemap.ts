import type { MetadataRoute } from "next";
import { site, categoryNames } from "@/data/site";
import { authors } from "@/data/authors";
import { articleSitemapEntries } from "@/lib/wp/articles";

/**
 * Peta situs untuk mesin pencari — krusial sejak peralihan domain, supaya
 * Google tidak perlu menemukan ulang ratusan artikel dengan meraba-raba.
 * Rute segar tiap jam (data artikelnya sendiri di-cache dengan tag
 * wp:posts, jadi terbit/hapus tulisan ikut menyegarkannya lewat webhook).
 */
export const revalidate = 3600;

/** Halaman statis di luar rubrik & artikel; path relatif terhadap akar. */
const HALAMAN_STATIS = [
  "",
  "tentang-tgr",
  "tentang-gfi",
  "pengurus-gfi",
  "redaksi",
  "hubungi-kami",
  "bedah-buku",
  "podcast",
  "gallery",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statis: MetadataRoute.Sitemap = HALAMAN_STATIS.map((path) => ({
    url: path ? `${site.url}/${path}` : site.url,
    changeFrequency: path === "" ? "daily" : "monthly",
    priority: path === "" ? 1 : 0.5,
  }));

  const rubrik: MetadataRoute.Sitemap = Object.keys(categoryNames).map(
    (slug) => ({
      url: `${site.url}/category/${slug}`,
      changeFrequency: "daily",
      priority: 0.7,
    })
  );

  const penulis: MetadataRoute.Sitemap = authors.map((a) => ({
    url: `${site.url}/penulis/${a.slug}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  // WP tak terjangkau ≠ sitemap tumbang: kembalikan rute non-artikel saja.
  // Sitemap tanpa artikel selama satu jendela revalidasi lebih baik daripada
  // URL sitemap yang menjawab 500 tepat saat crawler datang.
  let artikel: MetadataRoute.Sitemap = [];
  try {
    artikel = (await articleSitemapEntries()).map((p) => ({
      url: `${site.url}/${p.slug}`,
      // modified_gmt WordPress tanpa penanda zona; Z menegaskannya UTC.
      lastModified: p.modifiedGmt ? new Date(`${p.modifiedGmt}Z`) : undefined,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    }));
  } catch {
    // dibiarkan kosong — lihat catatan di atas
  }

  return [...statis, ...rubrik, ...penulis, ...artikel];
}
