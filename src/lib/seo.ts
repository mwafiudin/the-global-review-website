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

/**
 * URL gambar untuk pratinjau bagikan.
 *
 * Dinormalkan ke 1200x630 JPEG lewat wsrv, bukan diteruskan apa adanya,
 * karena tiga alasan:
 *
 * 1. Gambar unggulan WordPress rasionya bermacam-macam; platform sosial
 *    memotongnya sendiri dengan hasil yang tak terduga — kepala orang
 *    terpenggal, teks pada gambar hilang separuh. Memotongnya di sini
 *    membuat hasilnya sama di semua tempat.
 * 2. WhatsApp membatasi ukuran berkas pratinjau. Gambar asli beberapa MB
 *    tidak dirender sama sekali, dan kegagalannya senyap.
 * 3. Format dipaksa JPEG: dukungan WebP di crawler sosial masih tidak
 *    merata, dan pratinjau yang gagal ter-cache lama di sisi mereka.
 *
 * Berkas lokal (gambar pengganti) TIDAK dilewatkan wsrv — ia sudah tersaji
 * dari CDN Vercel, dan menambah lompatan ke pihak ketiga hanya menambah
 * satu titik gagal pada jalur yang sudah andal.
 */
export const OG_LEBAR = 1200;

/**
 * Tinggi 960, bukan 630 yang lazim dipakai sebagai ukuran Open Graph.
 *
 * Rasio 1,91:1 memang anjuran Facebook, tetapi WhatsApp merender pratinjau
 * berasio selebar itu sebagai thumbnail kecil di samping teks, bukan kartu
 * bergambar besar. Diuji pada perangkat redaksi: gambar brand lama
 * (1402x1122, rasio 1,25) tampil sebagai kartu besar, sedangkan 1200x630
 * pada artikel yang sama tampil kecil. Aplikasi, akun, dan tautan sama —
 * yang berbeda hanya rasionya.
 *
 * 4:3 dipilih karena WhatsApp jalur berbagi utama pembaca TGR di Indonesia.
 * Facebook dan X tetap merender besar pada rasio ini; keduanya memangkas
 * sendiri bila perlu, sedangkan WhatsApp tidak memberi pilihan.
 */
export const OG_TINGGI = 960;

export function gambarBagikan(src: string, situs: string): string {
  if (!src.startsWith("http")) return situs + src;
  return (
    "https://wsrv.nl/?url=" +
    encodeURIComponent(src) +
    `&w=${OG_LEBAR}&h=${OG_TINGGI}&fit=cover&q=82&output=jpg`
  );
}

/**
 * openGraph + twitter untuk satu artikel.
 *
 * Tanpa ini, halaman artikel mewarisi openGraph dari layout secara utuh —
 * termasuk judul dan gambarnya. Menyetel `title` di generateMetadata TIDAK
 * cukup: Next hanya menurunkannya ke og:title bila induknya tidak
 * mendefinisikan openGraph.title sendiri, dan di sini induknya
 * mendefinisikannya. Gejalanya menyesatkan karena <title> halaman sudah
 * benar, sehingga cacatnya hanya kelihatan saat tautannya dibagikan.
 */
export function ogArtikel(opsi: {
  judul: string;
  deskripsi: string;
  gambar: string;
  situs: string;
  path: string;
  lang: Lang;
  tanggal?: string;
  penulis?: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const gambar = gambarBagikan(opsi.gambar, opsi.situs);

  return {
    openGraph: {
      type: "article",
      title: opsi.judul,
      description: opsi.deskripsi,
      url: localizeHref(opsi.path, opsi.lang),
      locale: opsi.lang === "en" ? "en_US" : "id_ID",
      publishedTime: opsi.tanggal,
      authors: opsi.penulis ? [opsi.penulis] : undefined,
      images: [{ url: gambar, width: OG_LEBAR, height: OG_TINGGI, alt: opsi.judul }],
    },
    twitter: {
      card: "summary_large_image",
      title: opsi.judul,
      description: opsi.deskripsi,
      images: [gambar],
    },
  };
}
