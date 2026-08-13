import Image from "next/image";
import Link from "next/link";
import {
  CardCompact,
  CardHeadline,
  CardRow,
  CategoryTag,
  TitleWithHighlight,
} from "@/components/ArticleCard";
import { BrandBand } from "@/components/BrandBand";
import { WorldDotMap } from "@/components/WorldDotMap";
import { NewsletterForm } from "@/components/NewsletterForm";
import { PollSection } from "@/components/PollSection";
import { SectionHeading } from "@/components/SectionHeading";
import { Sidebar } from "@/components/Sidebar";
import { TabbedSection } from "@/components/TabbedSection";
import { getAuthor } from "@/data/authors";
import { articleHref, articleImage, formatDate } from "@/lib/articles";
import {
  allArticles,
  byCategories,
  byCategory,
  featuredArticles,
} from "@/lib/wp/articles";

export default async function HomePage() {
  const [heroes, analisisPool, internasionalPool, ragamPool, terbaru] =
    await Promise.all([
      featuredArticles(5),
      byCategories(["analisis", "geopolitik", "politik-keamanan", "diplomasi"], 12),
      byCategory("internasional", 6),
      byCategories(["sosial", "budaya", "media", "features"], 8),
      allArticles(24),
    ]);
  const [heroMain, ...heroSide] = heroes;
  const heroAuthor = getAuthor(heroMain.author);

  const usedSlugs = new Set([
    ...heroes.map((a) => a.slug),
    ...analisisPool.slice(0, 8).map((a) => a.slug),
    ...internasionalPool.map((a) => a.slug),
    ...ragamPool.slice(0, 4).map((a) => a.slug),
  ]);
  const tulisanLainnya = terbaru
    .filter((a) => !usedSlugs.has(a.slug))
    .slice(0, 6);

  const [internasionalMain, ...internasionalRest] = internasionalPool;

  return (
    <div>
      {/* Hero: satu cerita utama + daftar headline */}
      <section
        aria-label="Isu utama"
        className="mx-auto grid max-w-7xl gap-12 px-4 py-14 md:py-20 lg:grid-cols-12 lg:px-6"
      >
        <article className="lg:col-span-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
            Isu Utama
          </p>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-ink md:text-5xl">
            <Link
              href={articleHref(heroMain)}
              className="transition-opacity hover:opacity-90"
            >
              <TitleWithHighlight
                title={heroMain.title}
                highlight={heroMain.highlight}
              />
            </Link>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-body">
            {heroMain.excerpt}
          </p>
          <p className="mt-5 text-sm text-meta">
            <span className="font-semibold text-ink">{heroAuthor.name}</span>
            <span className="px-2" aria-hidden>
              ·
            </span>
            {formatDate(heroMain.date)}
          </p>
          <Link
            href={articleHref(heroMain)}
            className="mt-8 block aspect-[1200/630] w-full self-start overflow-hidden rounded-xl bg-canvas"
            tabIndex={-1}
            aria-hidden
          >
            <Image
              src={articleImage(heroMain, 1200, 630)}
              alt={heroMain.title}
              width={1200}
              height={630}
              priority
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="h-full w-full object-cover saturate-[0.9]"
            />
          </Link>
        </article>

        <div className="lg:col-span-4 lg:border-l lg:border-line lg:pl-10">
          <p className="border-b border-line pb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
            Sorotan
          </p>
          <div className="divide-y divide-line">
            {heroSide.map((a) => (
              <div key={a.slug} className="py-5">
                <CardHeadline article={a} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analisis dengan tab filter */}
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16 lg:px-6">
        <TabbedSection
          title="Analisis"
          href="/category/analisis"
          articles={analisisPool}
          tabs={[
            { label: "Semua", slug: null },
            { label: "Analisis", slug: "analisis" },
            { label: "Geopolitik", slug: "geopolitik" },
            { label: "Politik-Keamanan", slug: "politik-keamanan" },
            { label: "Diplomasi", slug: "diplomasi" },
          ]}
        />
      </div>

      {/* Internasional + Sosial & Budaya berbagi latar peta kontinen titik */}
      <div className="relative overflow-hidden">
        <WorldDotMap />

        {/* Internasional: sorotan lebar */}
        <section
          aria-label="Internasional"
          className="relative mx-auto max-w-7xl px-4 py-12 md:py-16 lg:px-6"
        >
        <SectionHeading
          title="Internasional"
          href="/category/internasional"
        />
        {internasionalMain && (
          <div className="grid gap-10 lg:grid-cols-2">
            <article className="group">
              <Link
                href={articleHref(internasionalMain)}
                className="block aspect-[16/10] w-full self-start overflow-hidden rounded-xl bg-canvas"
                tabIndex={-1}
                aria-hidden
              >
                <Image
                  src={articleImage(internasionalMain, 900, 560)}
                  alt={internasionalMain.title}
                  width={900}
                  height={560}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="h-full w-full object-cover saturate-50 transition-[filter] duration-300 group-hover:saturate-100"
                />
              </Link>
              <div className="pt-6">
                <CategoryTag slug={internasionalMain.category} />
                <h3 className="mt-3 font-display text-2xl font-extrabold leading-snug tracking-tight text-ink md:text-3xl">
                  <Link
                    href={articleHref(internasionalMain)}
                    className="transition-colors hover:text-accent"
                  >
                    <TitleWithHighlight
                      title={internasionalMain.title}
                      highlight={internasionalMain.highlight}
                    />
                  </Link>
                </h3>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-body">
                  {internasionalMain.excerpt}
                </p>
                <p className="mt-3 text-xs text-meta">
                  {formatDate(internasionalMain.date)}
                </p>
              </div>
            </article>
            <div className="flex flex-col justify-between gap-6 border-line lg:border-l lg:pl-10">
              {internasionalRest.map((a) => (
                <div
                  key={a.slug}
                  className="border-b border-line pb-6 last:border-0 last:pb-0"
                >
                  <CardCompact article={a} />
                </div>
              ))}
            </div>
          </div>
        )}
        </section>

        {/* Sosial, budaya, media, dan features dengan tab, layout grid */}
        <div className="relative mx-auto max-w-7xl px-4 py-12 md:py-16 lg:px-6">
          <TabbedSection
            title="Sosial & Budaya"
            href="/category/sosial"
            layout="grid"
            articles={ragamPool}
            tabs={[
              { label: "Semua", slug: null },
              { label: "Sosial", slug: "sosial" },
              { label: "Budaya", slug: "budaya" },
              { label: "Media", slug: "media" },
              { label: "Features", slug: "features" },
            ]}
          />
        </div>
      </div>

      {/* Pengenal brand: jeda di tengah halaman */}
      <BrandBand />

      {/* Jajak pendapat (carousel) */}
      <PollSection />

      {/* Tulisan lainnya + sidebar */}
      <div className="mx-auto grid max-w-7xl gap-14 px-4 py-12 pb-24 md:py-16 lg:grid-cols-[1fr_320px] lg:px-6">
        <section aria-label="Tulisan lainnya">
          <SectionHeading title="Tulisan Lainnya" />
          <div className="divide-y divide-line">
            {tulisanLainnya.map((a) => (
              <CardRow key={a.slug} article={a} />
            ))}
          </div>
        </section>
        <Sidebar />
      </div>

      <NewsletterForm />
    </div>
  );
}
