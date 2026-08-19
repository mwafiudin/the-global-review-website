"use client";

import { useLang } from "@/lib/i18n";

/**
 * Boundary galat per rute — dirender di dalam chrome (header/footer tetap
 * tampil). Selain galat server biasa, ini jaring pengaman untuk crash
 * removeChild yang dipicu terjemahan otomatis peramban (Google Translate
 * membungkus text node dengan <font>): tanpa boundary, seluruh halaman
 * jadi putih. Styling meniru not-found.tsx.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  const { t } = useLang();
  return (
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
  );
}
