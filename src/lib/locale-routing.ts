/**
 * Aturan routing dua bahasa — murni dan bebas dependensi supaya bisa dipakai
 * proxy (server), komponen client, dan tes tanpa penyesuaian.
 *
 * Skema URL: bahasa Indonesia tanpa prefiks (bentuk lama, terindeks Google),
 * bahasa Inggris di bawah /en. Prefiks /id hanya bentuk internal hasil
 * rewrite proxy; bila muncul di address bar, diarahkan balik ke tanpa prefiks
 * agar tidak lahir URL duplikat.
 */

export type Lang = "id" | "en";

export const LANGS: readonly Lang[] = ["id", "en"];
export const DEFAULT_LANG: Lang = "id";

export function isLocale(value: string | undefined): value is Lang {
  return value === "id" || value === "en";
}

export type RouteDecision =
  | { type: "rewrite"; pathname: string } // sajikan /id/* di balik URL tanpa prefiks
  | { type: "redirect"; pathname: string } // 308: /id/* di address bar → tanpa prefiks
  | { type: "next" }; // /en/* diteruskan apa adanya

function hasPrefix(pathname: string, lang: Lang): boolean {
  return pathname === `/${lang}` || pathname.startsWith(`/${lang}/`);
}

export function planLocaleRouting(pathname: string): RouteDecision {
  // Permalink WordPress lama memakai garis miring penutup (/slug/). Pulangkan
  // dulu ke bentuk tanpa penutup agar rewrite tidak mendahului normalisasi
  // trailing-slash Next dan berujung 404.
  if (pathname !== "/" && pathname.endsWith("/")) {
    return { type: "redirect", pathname: pathname.replace(/\/+$/, "") || "/" };
  }
  if (hasPrefix(pathname, "id")) {
    return { type: "redirect", pathname: pathname.slice(3) || "/" };
  }
  if (hasPrefix(pathname, "en")) {
    return { type: "next" };
  }
  return { type: "rewrite", pathname: pathname === "/" ? "/id" : `/id${pathname}` };
}

/**
 * Beri prefiks bahasa pada href internal. Href eksternal, mailto:, dan
 * anchor dibiarkan; href yang sudah berprefiks tidak diprefiks ulang.
 */
export function localizeHref(href: string, lang: Lang): string {
  if (lang === "id" || !href.startsWith("/")) return href;
  if (hasPrefix(href, "en")) return href;
  return href === "/" ? "/en" : `/en${href}`;
}

/**
 * Padanan pathname saat ini pada bahasa target — dipakai LanguageToggle
 * dan penanda menu aktif. usePathname bisa memunculkan bentuk internal
 * /id/* (hasil rewrite proxy, bertahan sampai setelah hidrasi), jadi kedua
 * prefiks bahasa dilepas dulu sebelum diprefiks ulang; tanpa itu /id/x
 * berubah jadi /en/id/x, bukan /en/x.
 */
export function alternatePath(pathname: string, target: Lang): string {
  const tanpaEn = hasPrefix(pathname, "en")
    ? pathname.slice(3) || "/"
    : pathname;
  const bare = hasPrefix(tanpaEn, "id") ? tanpaEn.slice(3) || "/" : tanpaEn;
  return target === "en" ? localizeHref(bare, "en") : bare;
}
