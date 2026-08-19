import { lang as langParam } from "next/root-params";
import { tFor } from "@/lib/dictionary/ui";
import {
  DEFAULT_LANG,
  isLocale,
  localizeHref,
  type Lang,
} from "@/lib/locale-routing";

/**
 * Akses bahasa untuk Server Component — membaca segmen root [lang] lewat
 * next/root-params sehingga tidak perlu mengoper params berlapis-lapis.
 * Tidak bisa dipakai di Client Component / Route Handler (batasan Next),
 * dan JANGAN dipanggil di dalam callback unstable_cache: cache data WP
 * sengaja bebas-bahasa supaya /x dan /en/x berbagi entri yang sama.
 */
export async function getLang(): Promise<Lang> {
  const nilai = await langParam();
  return isLocale(nilai) ? nilai : DEFAULT_LANG;
}

/** t: kamus berkunci string sumber Indonesia; l: prefiks href per bahasa. */
export async function getT() {
  const lang = await getLang();
  return {
    lang,
    t: tFor(lang),
    l: (href: string) => localizeHref(href, lang),
  };
}
