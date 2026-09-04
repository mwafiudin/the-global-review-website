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
 * URL gambar artikel untuk dipakai DI DALAM kartu pratinjau.
 *
 * Disajikan dari domain sendiri lewat rewrite /wp-content/uploads di
 * next.config, BUKAN lewat proxy wsrv seperti gambar di halaman.
 *
 * Alasannya diperoleh dari percobaan langsung, bukan teori. Melalui wsrv,
 * pratinjau WhatsApp kehilangan gambarnya sama sekali: ukuran yang baru
 * pertama diminta harus dibuat proxy dari nol, dan crawler tidak menunggu
 * selama itu. Gambar dari domain sendiri terkirim 0,17-0,29 detik dengan
 * cache setahun, dan tidak bergantung pihak ketiga mana pun.
 *
 * Ukurannya juga TIDAK dipaksa ke 1200x630. Gambar unggulan TGR aslinya
 * hanya 640-780px (8 dari 8 artikel yang disampel), jadi membesarkannya
 * tidak menambah satu piksel informasi pun — hanya memperbesar berkas dan
 * memperlambat pengambilan. Dimensi sengaja tidak dideklarasikan supaya
 * crawler mengukurnya sendiri alih-alih diberi angka yang keliru.
 *
 * Ukuran akhirnya ditentukan kartu (1200x630), jadi gambar sumber yang
 * kecil pun tetap menghasilkan pratinjau berukuran penuh — foto sekadar
 * mengisi panel kirinya.
 */
export function gambarBagikan(src: string, situs: string): string {
  if (!src.startsWith("http")) return situs + src;

  // cms.theglobal-review.com/wp-content/uploads/... -> domain sendiri.
  const uploads = src.indexOf("/wp-content/uploads/");
  if (uploads !== -1) return situs + src.slice(uploads);

  return src;
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
  path: string;
  lang: Lang;
  tanggal?: string;
  penulis?: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "article",
      title: opsi.judul,
      description: opsi.deskripsi,
      url: localizeHref(opsi.path, opsi.lang),
      locale: opsi.lang === "en" ? "en_US" : "id_ID",
      publishedTime: opsi.tanggal,
      authors: opsi.penulis ? [opsi.penulis] : undefined,
      // images SENGAJA tidak diisi: opengraph-image.tsx menggambar kartunya
      // sendiri, dan Next memasang og:image serta twitter:image dari sana.
      // Mengisinya di sini justru menimpa kartu itu dengan foto mentah.
    },
    twitter: {
      card: "summary_large_image",
      title: opsi.judul,
      description: opsi.deskripsi,
    },
  };
}
