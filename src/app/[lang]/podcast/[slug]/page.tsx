import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CaretRight, PlayCircle } from "@phosphor-icons/react/dist/ssr";
import { VideoEmbed, youtubeThumb } from "@/components/VideoEmbed";
import { EndMark } from "@/components/Ornaments";
import { formatDate } from "@/lib/articles";
import { wpPodcast, wpPodcasts } from "@/lib/wp/podcasts";

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
  const ep = await wpPodcast(slug);
  if (!ep) notFound();
  return {
    title: ep.headline,
    description:
      ep.ringkasan[0] ||
      `${ep.format} bersama ${ep.narasumber} di kanal ${ep.media}.`,
  };
}

export default async function PodcastDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ep = await wpPodcast(slug);
  if (!ep) notFound();

  const lainnya = (await wpPodcasts())
    .filter((p) => p.slug !== ep.slug)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:py-20">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-[0.14em] text-meta">
          <li>
            <Link href="/podcast" className="transition-colors hover:text-accent">
              Podcast
            </Link>
          </li>
          <li className="flex items-center gap-2">
            <CaretRight size={10} weight="bold" aria-hidden />
            <span className="text-ink">{ep.media}</span>
          </li>
        </ol>
      </nav>

      {/* Judul */}
      <div className="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]">
        <span className="text-brand">{ep.format}</span>
        <span className="text-line">·</span>
        <span className="text-meta">{ep.media}</span>
      </div>
      <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
        {ep.headline}
      </h1>
      <p className="mt-4 text-sm font-medium text-meta">
        Narasumber: {ep.narasumber} · {formatDate(ep.tanggal)}
      </p>

      {/* Video embed */}
      <div className="mt-8">
        <VideoEmbed id={ep.videoId} title={ep.headline} />
        <p className="mt-2.5 text-xs text-meta">
          Tayangan ini diproduksi dan diunggah oleh kanal{" "}
          <span className="font-semibold text-body">{ep.media}</span>. The Global
          Review menautkannya sebagai bagian dari rekam jejak narasumber GFI.
        </p>
      </div>

      {/* Artikel singkat */}
      <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-body">
        {ep.ringkasan.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <EndMark className="mt-12" />

      {/* Episode lainnya */}
      <div className="mt-12 border-t border-line pt-10">
        {lainnya.length > 0 && (
          <>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
              Penampilan lainnya
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {lainnya.map((o) => (
                <Link
                  key={o.slug}
                  href={`/podcast/${o.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="relative aspect-video overflow-hidden bg-black">
                    <Image
                      src={youtubeThumb(o.videoId)}
                      alt={`Cuplikan ${o.headline}`}
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <PlayCircle
                      size={36}
                      weight="fill"
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90 drop-shadow"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-meta">
                      {o.media}
                    </p>
                    <h3 className="mt-1.5 font-display text-sm font-bold leading-snug text-ink transition-colors group-hover:text-accent">
                      {o.headline}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <Link
          href="/podcast"
          className="mt-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent transition-opacity hover:opacity-70"
        >
          <ArrowLeft size={13} weight="bold" />
          Semua podcast
        </Link>
      </div>
    </div>
  );
}
