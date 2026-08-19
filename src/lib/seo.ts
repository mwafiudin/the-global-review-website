import type { Metadata } from "next";
import { localizeHref, type Lang } from "@/lib/locale-routing";

/**
 * Perkakas metadata dua bahasa. Semua path relatif — diselesaikan
 * metadataBase (site.url) di layout [lang].
 */

/**
 * noindex untuk halaman /en yang isinya masih duplikat bahasa Indonesia
 * (artikel, arsip rubrik, kanal). Dibuka kembali per halaman begitu
 * terjemahan kontennya sungguhan.
 */
export function robotsEn(lang: Lang): Metadata["robots"] | undefined {
  return lang === "en" ? { index: false, follow: true } : undefined;
}

/** canonical tunggal per bahasa, untuk halaman yang EN-nya noindex. */
export function kanonik(lang: Lang, path: string): Metadata["alternates"] {
  return { canonical: localizeHref(path, lang) };
}

/**
 * canonical + hreflang untuk halaman yang tersedia penuh di dua bahasa
 * (halaman statis). Dipancarkan di KEDUA versi agar pasangannya timbal
 * balik — syarat hreflang yang dianggap sah oleh Google.
 */
export function dwibahasa(lang: Lang, path: string): Metadata["alternates"] {
  return {
    canonical: localizeHref(path, lang),
    languages: {
      id: path,
      en: localizeHref(path, "en"),
      "x-default": path,
    },
  };
}
