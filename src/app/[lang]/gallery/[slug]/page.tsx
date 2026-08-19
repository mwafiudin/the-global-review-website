import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CaretRight, MapPin } from "@phosphor-icons/react/dist/ssr";
import { photoSrc } from "@/data/gallery";
import { formatDate } from "@/lib/articles";
import { wpAlbum, wpAlbums } from "@/lib/wp/gallery";
import { getT } from "@/lib/i18n-server";

// Bergantung data WordPress — dirender on-demand lalu di-cache (ISR),
// sama seperti rute artikel; build tidak memanggil WP.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const album = await wpAlbum(slug);
  if (!album) notFound();
  return { title: `${album.judul} — Galeri`, description: album.ringkasan };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = await wpAlbum(slug);
  if (!album) notFound();

  const { lang, t, l } = await getT();
  const lainnya = (await wpAlbums())
    .filter((a) => a.slug !== album.slug)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-[0.14em] text-meta">
          <li>
            <Link href={l("/gallery")} className="transition-colors hover:text-accent">
              {t("Galeri")}
            </Link>
          </li>
          <li className="flex items-center gap-2">
            <CaretRight size={10} weight="bold" aria-hidden />
            <span className="text-ink">{album.kategori}</span>
          </li>
        </ol>
      </nav>

      {/* Header album */}
      <div className="mt-5 max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
          {album.kategori}
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          {album.judul}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-body">
          {album.ringkasan}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-meta">
          <span>{formatDate(album.tanggal, lang)}</span>
          <span className="flex items-center gap-1.5">
            <MapPin size={14} weight="regular" />
            {album.lokasi}
          </span>
          <span>{album.foto.length} {t("foto")}</span>
        </div>
      </div>

      {/* Grid foto */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {album.foto.map((f) => (
          <figure key={f.seed} className="group">
            <div className="overflow-hidden rounded-xl bg-canvas">
              <Image
                src={f.src ?? photoSrc(f.seed, 800, 560)}
                alt={f.caption}
                width={800}
                height={560}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="aspect-[10/7] w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <figcaption className="pt-2.5 text-sm leading-relaxed text-meta">
              {f.caption}
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Album lainnya */}
      <div className="mt-16 border-t border-line pt-10">
        {lainnya.length > 0 && (
          <>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
              {t("Album Lainnya")}
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {lainnya.map((o) => (
                <Link
                  key={o.slug}
                  href={l(`/gallery/${o.slug}`)}
                  className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="relative aspect-[3/2] overflow-hidden bg-canvas">
                    <Image
                      src={o.foto[0].src ?? photoSrc(o.foto[0].seed, 600, 400)}
                      alt={o.judul}
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-meta">
                      {o.kategori}
                    </p>
                    <h3 className="mt-1.5 font-display text-sm font-bold leading-snug text-ink transition-colors group-hover:text-accent">
                      {o.judul}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <Link
          href={l("/gallery")}
          className="mt-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent transition-opacity hover:opacity-70"
        >
          <ArrowLeft size={13} weight="bold" />
          {t("Semua album")}
        </Link>
      </div>
    </div>
  );
}
