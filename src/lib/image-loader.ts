import type { ImageLoaderProps } from "next/image";

import { site } from "@/data/site";

// Loader cadangan saat optimizer bawaan mati (kuota Image Optimization habis
// -> 402): wsrv.nl adalah proxy gambar publik nirlaba yang tetap memberi
// resize + cache CDN tanpa perlu akun. we=1 mencegah upscaling ukuran srcset
// yang lebih besar dari file aslinya.
export function wsrvLoader({ src, width, quality }: ImageLoaderProps): string {
  const asal = src.startsWith("http")
    ? src
    : (typeof window === "undefined" ? site.url : window.location.origin) + src;
  return `https://wsrv.nl/?url=${encodeURIComponent(asal)}&w=${width}&q=${quality ?? 75}&we=1`;
}
