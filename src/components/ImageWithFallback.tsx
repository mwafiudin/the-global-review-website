"use client";

import NextImage, { type ImageProps } from "next/image";
import { useState } from "react";

import { wsrvLoader } from "@/lib/image-loader";

// Insiden 26 Agu 2026: kuota Image Optimization paket Hobby habis dan semua
// transform baru dijawab 402 -> ikon gambar rusak di browser tanpa cache.
// Komponen ini pengganti drop-in next/image dengan jalur muat berlapis:
//   1. optimizer bawaan (gratis selama kuota bulanan masih ada)
//   2. proxy wsrv.nl (resize + CDN tetap jalan)
//   3. file asli tanpa optimasi
// Impor gambar selalu lewat sini, jangan langsung dari next/image, supaya
// call site baru otomatis kebagian jalur cadangannya.
export default function ImageWithFallback(props: ImageProps) {
  const [tahap, setTahap] = useState(0);

  return (
    <NextImage
      key={tahap}
      {...props}
      loader={tahap === 1 ? wsrvLoader : undefined}
      unoptimized={tahap >= 2 ? true : props.unoptimized}
      onError={
        tahap < 2
          ? () => {
              console.warn(
                `[gambar] jalur ${tahap === 0 ? "optimizer" : "wsrv"} gagal untuk "${String(
                  props.src
                )}", pindah ke jalur berikutnya`
              );
              setTahap(tahap + 1);
            }
          : undefined
      }
    />
  );
}
