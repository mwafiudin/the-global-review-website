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
  // output=webp WAJIB diminta: wsrv tidak menegosiasi format lewat header
  // Accept, jadi tanpa ini PNG tetap dikirim sebagai PNG. Terukur pada satu
  // gambar sumber PNG di situs ini: 606 KB -> 45 KB pada lebar 640 (hemat
  // 93%); gambar hero berformat JPEG turun 34 KB -> 21 KB (37%).
  return `https://wsrv.nl/?url=${encodeURIComponent(
    asal
  )}&w=${width}&q=${quality ?? 75}&we=1&output=webp`;
}
