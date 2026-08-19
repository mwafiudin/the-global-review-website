"use client";

import { useEffect } from "react";
import { EN } from "@/lib/dictionary/ui";
// Pola resmi: global-error wajib membawa global styles-nya sendiri
// (docs error.md). Chunk CSS terpisah ini bisa memicu overlay dev
// "No link element found for chunk" — bug HMR Turbopack yang dikenal
// (vercel/next.js#74749, dev-only); hard refresh memulihkannya.
import "./globals.css";

/**
 * Boundary galat paling luar — menggantikan root layout saat layout itu
 * sendiri gagal, jadi wajib merender <html>/<body> sendiri. Konteks bahasa
 * dan theme-init.js tidak tersedia di sini: bahasa dibaca dari path,
 * kelas dark dipulihkan dari localStorage lewat effect.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    try {
      const simpanan = localStorage.getItem("tgr-theme");
      const gelap =
        simpanan === "dark" ||
        (simpanan === null &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", gelap);
    } catch {}
  }, []);

  const en =
    typeof window !== "undefined" && window.location.pathname.startsWith("/en");
  const t = (s: string) => (en ? EN[s] ?? s : s);

  return (
    <html lang={en ? "en" : "id"}>
      <body className="antialiased">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-28 text-center">
          <p className="font-display text-7xl font-extrabold text-accent">!</p>
          <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-tight text-ink">
            {t("Terjadi kesalahan")}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-meta">
            {t("Halaman yang Anda cari mungkin telah dipindahkan atau tidak tersedia.")}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-7 rounded-lg border border-ink bg-surface px-6 py-3 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-surface active:scale-[0.98]"
          >
            {t("Muat ulang")}
          </button>
        </div>
      </body>
    </html>
  );
}
