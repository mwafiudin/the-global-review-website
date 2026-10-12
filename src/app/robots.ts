import type { MetadataRoute } from "next";
import { site } from "@/data/site";

/**
 * Halaman statis yang versi /en-nya diindeks (alternates dwibahasa +
 * hreflang). Tambahkan di sini bila halaman lain dibuka untuk mesin pencari
 * — tanpa itu Disallow /en/ di bawah menutupnya.
 */
const EN_TERINDEKS = [
  "/tentang-gfi",
  "/tentang-tgr",
  "/pengurus-gfi",
  "/hubungi-kami",
  "/redaksi",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Aturan terpanjang yang menang (Google/Bing): Allow spesifik ini
      // mengalahkan Disallow /en/.
      allow: ["/", ...EN_TERINDEKS.map((p) => `/en${p}`)],
      disallow: [
        // Endpoint internal (search/subscribe/vote/revalidate) — bukan konten.
        "/api/",
        // Pohon /en sisanya salinan bahasa Indonesia yang noindex (lib/seo
        // robotsEn), diterjemahkan di browser. Crawler yang menyusurinya
        // memaksa server merender dan menyimpan dua kali jumlah halaman —
        // akar pemakaian RAM di Railway. "/en$" untuk beranda /en; jangan
        // "/en" polos, itu ikut menutup slug Indonesia berawalan "en…".
        "/en/",
        "/en$",
      ],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
