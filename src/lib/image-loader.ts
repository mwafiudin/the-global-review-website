import type { ImageLoaderProps } from "next/image";

import { site } from "@/data/site";

// Loader cadangan saat optimizer bawaan mati (kuota Image Optimization habis
// -> 402): wsrv.nl adalah proxy gambar publik nirlaba yang tetap memberi
// resize + cache CDN tanpa perlu akun. we=1 mencegah upscaling ukuran srcset
// yang lebih besar dari file aslinya.
export function wsrvLoader({ src, width, quality }: ImageLoaderProps): string {
  // SVG dilewatkan apa adanya. Ia vektor — tidak ada yang bisa diperkecil,
  // dan melewatkannya ke proxy raster berarti menukar berkas lokal yang
  // tersaji instan dari CDN Vercel dengan perjalanan ke pihak ketiga.
  // Wordmark situs adalah SVG dan ikut di-preload, jadi ini tepat berada di
  // jalur kritis render pertama.
  if (src.endsWith(".svg")) return src;

  const asal = src.startsWith("http")
    ? src
    : (typeof window === "undefined" ? site.url : window.location.origin) + src;
  return `https://wsrv.nl/?url=${encodeURIComponent(asal)}&w=${width}&q=${quality ?? 75}&we=1`;
}
