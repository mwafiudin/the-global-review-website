import Link from "next/link";
import { halamanHref, halamanWindow } from "@/lib/pagination";

/**
 * Nav paginasi arsip rubrik. Tautan <a> biasa (bukan tombol client) supaya
 * mesin pencari punya jalur merambat ke artikel di luar 100 terbaru — itu
 * alasan utama paginasi ini ada.
 */
export function PaginationNav({
  rubrikKey,
  current,
  totalPages,
}: {
  rubrikKey: string;
  current: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const tautan =
    "rounded-lg border border-line bg-surface px-3.5 py-2.5 text-xs font-bold text-ink transition-colors hover:border-ink";
  const aktif =
    "rounded-lg border border-ink bg-ink px-3.5 py-2.5 text-xs font-bold text-surface";

  return (
    <nav
      aria-label="Navigasi halaman arsip"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      {current > 1 && (
        <Link href={halamanHref(rubrikKey, current - 1)} className={tautan}>
          ‹ Sebelumnya
        </Link>
      )}
      {halamanWindow(current, totalPages).map((n, i) =>
        n === null ? (
          <span
            key={`elipsis-${i}`}
            aria-hidden="true"
            className="px-1 text-sm text-meta"
          >
            …
          </span>
        ) : n === current ? (
          <span key={n} aria-current="page" className={aktif}>
            {n}
          </span>
        ) : (
          <Link key={n} href={halamanHref(rubrikKey, n)} className={tautan}>
            {n}
          </Link>
        )
      )}
      {current < totalPages && (
        <Link href={halamanHref(rubrikKey, current + 1)} className={tautan}>
          Berikutnya ›
        </Link>
      )}
    </nav>
  );
}
