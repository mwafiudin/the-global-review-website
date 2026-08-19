import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-28 text-center">
      <p className="font-display text-7xl font-extrabold text-accent">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-tight text-ink">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-meta">
        Halaman yang Anda cari mungkin telah dipindahkan atau tidak tersedia.
      </p>
      <Link
        href="/"
        className="mt-7 rounded-lg border border-ink bg-surface px-6 py-3 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-surface active:scale-[0.98]"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
