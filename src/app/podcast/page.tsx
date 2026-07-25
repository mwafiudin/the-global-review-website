import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Microphone, PlayCircle } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/PageHeader";
import { youtubeThumb } from "@/components/VideoEmbed";
import { allPodcasts } from "@/data/podcasts";
import { formatDate } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Podcast",
  description:
    "Rekam jejak penampilan tim Global Future Institute sebagai narasumber di berbagai podcast, talkshow, dan kanal media.",
};

const episodes = allPodcasts();
const utama = episodes.find((e) => e.featured) ?? episodes[0];
const lainnya = episodes.filter((e) => e.slug !== utama.slug);

export default function PodcastPage() {
  return (
    <>
      <PageHeader
        title="Podcast"
        icon={Microphone}
        lead="Rekam jejak tim Global Future Institute sebagai narasumber di berbagai podcast, talkshow, dan kanal media, lengkap dengan tayangannya."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 pb-20">
        {/* Episode utama */}
        <Link
          href={`/podcast/${utama.slug}`}
          className="group grid gap-6 overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:grid-cols-2"
        >
          <div className="relative aspect-video overflow-hidden bg-black md:aspect-auto">
            <Image
              src={youtubeThumb(utama.videoId)}
              alt={`Cuplikan ${utama.headline}`}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              priority
            />
            <PlayCircle
              size={64}
              weight="fill"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90 drop-shadow-lg transition-transform group-hover:scale-110"
            />
          </div>
          <div className="flex flex-col justify-center p-6 md:p-8">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]">
              <span className="text-brand">{utama.format}</span>
              <span className="text-line">·</span>
              <span className="text-meta">{utama.media}</span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-extrabold leading-snug tracking-tight text-ink transition-colors group-hover:text-accent">
              {utama.headline}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed">
              {utama.ringkasan[0]}
            </p>
            <p className="mt-4 text-sm text-meta">
              Narasumber: {utama.narasumber} · {formatDate(utama.tanggal)}
            </p>
          </div>
        </Link>

        {/* Episode lainnya */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lainnya.map((ep) => (
            <Link
              key={ep.slug}
              href={`/podcast/${ep.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-video overflow-hidden bg-black">
                <Image
                  src={youtubeThumb(ep.videoId)}
                  alt={`Cuplikan ${ep.headline}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <PlayCircle
                  size={48}
                  weight="fill"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90 drop-shadow-md transition-transform group-hover:scale-110"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">
                  <span className="text-brand">{ep.format}</span>
                  <span className="text-line">·</span>
                  <span className="text-meta">{ep.media}</span>
                </div>
                <h3 className="mt-2.5 font-display text-lg font-bold leading-snug text-ink transition-colors group-hover:text-accent">
                  {ep.headline}
                </h3>
                <p className="mt-auto pt-4 text-xs text-meta">
                  {formatDate(ep.tanggal)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
