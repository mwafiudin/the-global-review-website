"use client";

import NextImage, { type ImageProps } from "next/image";
import { useState } from "react";

import { wsrvLoader } from "@/lib/image-loader";

/**
 * Pengganti drop-in next/image dengan jalur muat berlapis. Impor gambar
 * selalu lewat sini, jangan langsung dari next/image, supaya call site baru
 * otomatis kebagian jalur cadangannya.
 *
 * Jalurnya kini dua, bukan tiga:
 *   0. proxy wsrv.nl — resize + WebP + CDN, gratis tanpa akun
 *   1. berkas asli tanpa optimasi
 *
 * Optimizer bawaan Vercel SENGAJA DILEWATI sejak 3 September 2026. Kuota
 * Image Optimization paket Hobby habis pada 26 Agustus dan belum pulih:
 * setiap lebar dijawab 402 dalam 0,5-1,2 detik. Selama ia berada di jalur
 * pertama, tiap gambar membayar satu permintaan gagal sebelum cadangan
 * dijalankan — dan `priority` justru memperparah, karena preload di <head>
 * mengikat bandwidth paling awal ke URL yang dijamin gagal. Itu yang
 * membuat LCP lapangan tertahan di 2.736 ms.
 *
 * Melewatinya bukan sekadar tambal: paket Hobby akan menghabiskan kuota itu
 * lagi tiap bulan, sedangkan wsrv.nl tanpa kuota. Bila suatu saat optimizer
 * bawaan ingin dipakai lagi, kembalikan jalurnya di sini — cukup satu
 * lapisan tambahan di depan, dengan konsekuensi yang sama bila kuotanya
 * habis lagi.
 */
export default function ImageWithFallback(props: ImageProps) {
  const [tahap, setTahap] = useState(0);

  return (
    <NextImage
      key={tahap}
      {...props}
      // Loader menentukan srcset DAN URL preload yang ditulis `priority`,
      // jadi mengganti loader di sini sekaligus membetulkan preload-nya.
      loader={tahap === 0 ? wsrvLoader : undefined}
      unoptimized={tahap >= 1 ? true : props.unoptimized}
      onError={
        tahap < 1
          ? () => {
              console.warn(
                `[gambar] wsrv gagal untuk "${String(
                  props.src
                )}", memakai berkas asli`
              );
              setTahap(1);
            }
          : undefined
      }
    />
  );
}
