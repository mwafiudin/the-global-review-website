import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  FacebookLogo,
  PlayCircle,
  ThumbsUp,
} from "@phosphor-icons/react/dist/ssr";
import type { NavItem } from "@/data/site";
import {
  partnerLinksIndonesia,
  partnerLinksInternational,
  site,
} from "@/data/site";
import { bookByline } from "@/data/books";
import { articleHref } from "@/lib/articles";
import { featuredArticles } from "@/lib/wp/articles";
import { getT } from "@/lib/i18n-server";
import { bukuPilihan } from "@/lib/wp/books";
import { wpPodcasts } from "@/lib/wp/podcasts";
import { youtubeThumb } from "./VideoEmbed";
import type { PollView } from "@/lib/polls";
import { PollCard } from "./PollCard";

function WidgetTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 border-b border-line pb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
      {children}
    </h2>
  );
}

/** Kelompok chip tautan eksternal dengan sub-label kawasan. */
function ReferenceGroup({
  label,
  links,
  className = "",
}: {
  label: string;
  links: NavItem[];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-meta">
        {label}
      </p>
      <ul className="flex flex-wrap gap-2">
        {links.map((p) => (
          <li key={p.href}>
            <a
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] text-body transition-colors hover:border-accent/40 hover:text-accent"
            >
              {p.label}
              <ArrowUpRight
                size={11}
                weight="bold"
                className="text-meta transition-colors group-hover:text-accent"
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** polls: hanya diisi di halaman artikel yang memiliki jajak pendapat. */
export async function Sidebar({ polls }: { polls?: PollView[] }) {
  const [populer, semuaPodcast, buku] = await Promise.all([
    featuredArticles(5),
    wpPodcasts(),
    bukuPilihan(),
  ]);
  const podcastTerbaru = semuaPodcast.slice(0, 3);
  const { t, l } = await getT();

  return (
    <aside className="flex flex-col gap-14" aria-label="Sidebar">
      {/* Jajak pendapat artikel ini (bila ada) */}
      {polls && polls.length > 0 && (
        <section className="flex flex-col gap-6">
          {polls.map((pv) => (
            <PollCard
              key={pv.poll.id}
              poll={pv.poll}
              sourceHref={pv.sourceHref}
              sourceTitle={pv.sourceTitle}
              sourceCategory={pv.sourceCategory}
              closed={pv.closed}
              compact
            />
          ))}
        </section>
      )}

      {/* Terpopuler */}
      <section>
        <WidgetTitle>{t("Terpopuler")}</WidgetTitle>
        <ol className="space-y-5">
          {populer.map((a, i) => (
            <li key={a.slug} className="flex gap-4">
              <span className="font-display text-sm font-bold text-meta">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Link
                href={l(articleHref(a))}
                className="font-display text-sm font-semibold leading-snug text-ink transition-colors hover:text-accent"
              >
                {a.title}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Podcast terbaru */}
      <section>
        <WidgetTitle>{t("Podcast Terbaru")}</WidgetTitle>
        <ul className="space-y-4">
          {podcastTerbaru.map((ep) => (
            <li key={ep.slug}>
              <Link
                href={l(`/podcast/${ep.slug}`)}
                className="group flex gap-3.5"
              >
                <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-black">
                  <Image
                    src={youtubeThumb(ep.videoId)}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                  <PlayCircle
                    size={22}
                    weight="fill"
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90 drop-shadow"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-meta">
                    {ep.media}
                  </p>
                  <p className="mt-1 line-clamp-2 font-display text-[13px] font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
                    {ep.headline}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={l("/podcast")}
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-opacity hover:opacity-70"
        >
          {t("Semua podcast")}
          <ArrowRight size={12} weight="regular" />
        </Link>
      </section>

      {/* Promo buku */}
      <section>
        <WidgetTitle>{t("Bedah Buku")}</WidgetTitle>
        <Link
          href={l("/bedah-buku")}
          className="group block overflow-hidden rounded-xl border border-line bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
        >
          <Image
            src={buku.cover}
            alt={`Sampul buku ${buku.judul}`}
            width={1088}
            height={1452}
            sizes="320px"
            className="aspect-[4/3] w-full bg-canvas object-cover object-top"
          />
          <div className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-meta">
              {t("Buku pilihan")}
            </p>
            <p className="mt-2.5 font-display text-lg font-bold leading-snug tracking-tight text-ink">
              {buku.judul}
            </p>
            <p className="mt-2 text-sm text-body">{bookByline(buku)}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
              {t("Baca ulasannya")}
              <ArrowRight
                size={12}
                weight="regular"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </Link>
      </section>

      {/* Halaman Facebook: kartu on-brand, bukan plugin resmi (lihat site.ts) */}
      <section>
        <WidgetTitle>{t("Ikuti di Facebook")}</WidgetTitle>
        <a
          href={site.social.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="group block overflow-hidden rounded-xl border border-line bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-sm"
        >
          <div className="flex items-center gap-3.5 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-canvas text-accent ring-1 ring-inset ring-line">
              <FacebookLogo size={22} weight="fill" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[15px] font-bold leading-snug text-ink transition-colors group-hover:text-accent">
                {site.facebookPage.handle}
              </p>
              <p className="mt-0.5 text-xs text-meta">
                <span className="font-semibold text-body">
                  {site.facebookPage.followers.toLocaleString("id-ID")}
                </span>{" "}
                <span>{t("pengikut")}</span>
              </p>
            </div>
          </div>
          <div className="border-t border-line px-5 py-3.5">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
              <ThumbsUp size={14} weight="fill" />
              {t("Suka Halaman")}
              <ArrowUpRight
                size={12}
                weight="bold"
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </span>
          </div>
        </a>
      </section>

      {/* Jaringan rujukan: mitra & sumber, ditata sebagai chip */}
      <section>
        <WidgetTitle>{t("Jaringan Rujukan")}</WidgetTitle>
        <p className="-mt-1 mb-5 text-[13px] leading-relaxed text-body">
          {t("Sumber dan mitra pantauan kami, dari lembaga resmi dalam negeri hingga media analisis lintas kawasan.")}
        </p>
        <ReferenceGroup label={t("Indonesia")} links={partnerLinksIndonesia} />
        <ReferenceGroup
          label={t("Internasional")}
          links={partnerLinksInternational}
          className="mt-5"
        />
      </section>
    </aside>
  );
}
