import { NextResponse, type NextRequest } from "next/server";
import { planLocaleRouting } from "@/lib/locale-routing";

/**
 * Gerbang dua bahasa (konvensi Next 16: proxy, pengganti middleware).
 * URL Indonesia tetap tanpa prefiks — di baliknya disajikan pohon /id lewat
 * rewrite (address bar tidak berubah). /en diteruskan apa adanya, dan /id
 * yang muncul di address bar dipulangkan permanen supaya tidak lahir URL
 * duplikat. Logikanya di lib/locale-routing.ts agar teruji unit.
 */
export function proxy(request: NextRequest) {
  const keputusan = planLocaleRouting(request.nextUrl.pathname);
  if (keputusan.type === "redirect") {
    const url = request.nextUrl.clone();
    url.pathname = keputusan.pathname;
    return NextResponse.redirect(url, 308);
  }
  if (keputusan.type === "rewrite") {
    const url = request.nextUrl.clone();
    url.pathname = keputusan.pathname;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  // Kecualikan API, aset internal Next, dan semua path berekstensi
  // (favicon.ico, sitemap.xml, robots.txt, manifest.webmanifest,
  // theme-init.js, /images/*). Catatan: SLUG_RE di api/revalidate
  // mengizinkan titik pada slug — bila redaksi pernah menerbitkan slug
  // bertitik, ganti pola titik ini dengan daftar ekstensi eksplisit.
  matcher: ["/((?!api|_next|wp-content|.*\\..*).*)"],
};
