import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImagesSquare } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/PageHeader";
import { albums, photoSrc } from "@/data/gallery";
import { formatDate } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Galeri",
  description:
    "Album dokumentasi kegiatan Global Future Institute: seminar, diskusi, riset, dan silaturahmi.",
};

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        title="Galeri"
        icon={ImagesSquare}
        lead="Album dokumentasi kegiatan Global Future Institute — seminar, diskusi, riset, hingga silaturahmi redaksi."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <Link
              key={a.slug}
              href={`/gallery/${a.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-[3/2] overflow-hidden bg-canvas">
                <Image
                  src={photoSrc(a.foto[0].seed, 720, 480)}
                  alt={a.judul}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                />
                <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  {a.kategori}
                </span>
                <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  {a.foto.length} foto
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-display text-lg font-bold leading-snug text-ink transition-colors group-hover:text-accent">
                  {a.judul}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-body">
                  {a.ringkasan}
                </p>
                <p className="mt-3 text-xs text-meta">
                  {formatDate(a.tanggal)} · {a.lokasi}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
