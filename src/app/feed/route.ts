import { getAuthor } from "@/data/authors";
import { site } from "@/data/site";
import { articleHref, categoryName } from "@/lib/articles";
import type { Article } from "@/lib/types";
import { allArticles } from "@/lib/wp/articles";

/**
 * Umpan RSS 2.0 situs. Era WordPress, /feed dilayani WP dan agregator/
 * pembaca RSS berlangganan ke sana — pasca-cutover apex dilayani Next.js
 * dan URL itu mati diam-diam. Rute ini menghidupkannya kembali dari data
 * artikel yang sudah ada; variasi lain (/comments/feed, /category/x/feed,
 * /{slug}/feed) di-308-kan ke sini lewat redirects() next.config.ts, dan
 * proxy.ts mengecualikan /feed dari rewrite bahasa.
 */

// ISR: umpan ikut segar lewat jendela berkala; datanya sendiri di-cache
// dengan tag wp:posts sehingga webhook penerbitan juga menyegarkannya.
export const revalidate = 300;

const JUMLAH_ITEM = 20;

function esc(teks: string): string {
  return teks.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;"
  );
}

const HARI = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const BULAN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-08-13T08:59:16" (jam dinding WIB) → RFC 822 ber-offset +0700. */
function pubDate(dateTime: string): string {
  const [tanggal, jam = "00:00:00"] = dateTime.split("T");
  const [y, m, d] = tanggal.split("-").map(Number);
  const hari = HARI[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${hari}, ${String(d).padStart(2, "0")} ${BULAN[m - 1]} ${y} ${jam} +0700`;
}

function item(a: Article): string {
  const url = `${site.url}${articleHref(a)}`;
  return `    <item>
      <title>${esc(a.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${pubDate(a.dateTime ?? `${a.date}T00:00:00`)}</pubDate>
      <category>${esc(categoryName(a.category))}</category>
      <dc:creator>${esc(getAuthor(a.author).name)}</dc:creator>
      <description>${esc(a.excerpt)}</description>
    </item>`;
}

export async function GET() {
  // WP tak terjangkau ≠ umpan tumbang: umpan tanpa item selama satu jendela
  // lebih baik daripada URL langganan yang menjawab 500 (pola sitemap.ts).
  let articles: Article[] = [];
  try {
    articles = await allArticles(JUMLAH_ITEM);
  } catch {
    // dibiarkan kosong — lihat catatan di atas
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(site.name)}</title>
    <link>${esc(site.url)}</link>
    <atom:link href="${esc(`${site.url}/feed`)}" rel="self" type="application/rss+xml"/>
    <description>${esc(site.description)}</description>
    <language>id</language>
${articles.map(item).join("\n")}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
