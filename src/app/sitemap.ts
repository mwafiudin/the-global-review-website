import type { MetadataRoute } from "next";
import { site, categoryNames } from "@/data/site";
import { authors } from "@/data/authors";
import { articleSitemapEntries } from "@/lib/wp/articles";
import { FE_AUTHOR_DENGAN_WP } from "@/lib/wp/map";

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

/**
 * Halaman yang tersedia penuh dalam bahasa Inggris di /en/{path} dan boleh
 * diindeks — dipasangkan lewat alternates.languages. Beranda, artikel, dan
 * kanal lain TIDAK masuk: versi /en mereka masih noindex (konten Indonesia).
 */
const HALAMAN_DWIBAHASA = new Set([
  "tentang-tgr",
  "tentang-gfi",
  "pengurus-gfi",
  "redaksi",
  "hubungi-kami",
]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statis: MetadataRoute.Sitemap = HALAMAN_STATIS.flatMap((path) => {
    const url = path ? `${site.url}/${path}` : site.url;
    if (!HALAMAN_DWIBAHASA.has(path)) {
      return [
        {
          url,
          changeFrequency: path === "" ? ("daily" as const) : ("monthly" as const),
          priority: path === "" ? 1 : 0.5,
        },
      ];
    }
    const alternates = {
      languages: { id: url, en: `${site.url}/en/${path}` },
    };
    return [
      { url, changeFrequency: "monthly" as const, priority: 0.5, alternates },
      {
        url: `${site.url}/en/${path}`,
        changeFrequency: "monthly" as const,
        priority: 0.4,
        alternates,
      },
    ];
  });

  const rubrik: MetadataRoute.Sitemap = Object.keys(categoryNames).map(
    (slug) => ({
      url: `${site.url}/category/${slug}`,
      changeFrequency: "daily",
      priority: 0.7,
    })
  );

  // Hanya penulis ber-akun WordPress — halaman penulis lain selamanya
  // "Belum ada tulisan." dan tidak layak diiklankan ke crawler.
  const penulis: MetadataRoute.Sitemap = authors
    .filter((a) => FE_AUTHOR_DENGAN_WP.has(a.slug))
    .map((a) => ({
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
