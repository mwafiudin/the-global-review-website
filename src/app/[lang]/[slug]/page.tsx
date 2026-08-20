import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { getAuthor } from "@/data/authors";
import { getT } from "@/lib/i18n-server";
import { DEFAULT_LANG, isLocale } from "@/lib/locale-routing";
import { kanonik, robotsEn } from "@/lib/seo";
import {
  articleHref,
  articleImage,
  categoryName,
  formatDate,
  readingMinutes,
} from "@/lib/articles";
import { adjacentArticles, byCategory, getArticle } from "@/lib/wp/articles";
import { toPollViews, wpPollsForArticle } from "@/lib/wp/polls";
import {
  CardFeature,
  CategoryTag,
  TitleWithHighlight,
} from "@/components/ArticleCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Sidebar } from "@/components/Sidebar";
import { EndMark } from "@/components/Ornaments";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ShareButtons } from "@/components/ShareButtons";

/**
 * Sengaja kosong: seluruh artikel dirender on-demand lalu di-cache (ISR +
 * webhook). Prerender massal saat build memberondong host WordPress yang
 * membatasi burst (503) dan membuat build gagal timeout — sedangkan arsip
 * 5.600+ artikel memang mustahil di-prerender seluruhnya.
 */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const bahasa = isLocale(lang) ? lang : DEFAULT_LANG;
  const article = await getArticle(slug);
  // notFound di sini, bukan hanya di body page. Sejak layout [lang] dinamis,
  // shell + fallback loading.tsx terkirim lebih dulu sehingga statusnya 200;
  // Next menyisipkan <meta name="robots" content="noindex"> pada 404 yang
  // di-stream (didokumentasikan di loading.md) — slug mati tidak terindeks.
  // Hard 404 tetap berlaku untuk path multi-segmen (catch-all tanpa loading).
  if (!article) notFound();
  return {
    // Konten /en masih bahasa Indonesia (duplikat) — jangan diindeks.
    robots: robotsEn(bahasa),
    alternates: kanonik(bahasa, `/${slug}`),
    title: article.title,
    // Excerpt kosong = excerpt otomatis WP (duplikat awal body) yang
    // sengaja tidak ditampilkan sebagai lead; meta tetap butuh deskripsi.
    description: article.excerpt || article.body[0]?.slice(0, 160),
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const { lang, t, l } = await getT();
  const author = getAuthor(article.author);
  const parentCategory = article.category.split("/")[0];
  const [inParent, { prev, next }, articlePolls] = await Promise.all([
    byCategory(parentCategory),
    adjacentArticles(article),
    wpPollsForArticle(article.slug).then(toPollViews),
  ]);
  const related = inParent
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 md:py-20 lg:px-6">
      <ReadingProgress />
      <div className="grid gap-14 lg:grid-cols-[1fr_320px]">
        <article>
          <CategoryTag slug={article.category} />
          <h1 className="mt-4 max-w-[24ch] font-display text-3xl font-extrabold leading-[1.15] tracking-tight text-ink md:text-[42px]">
            <TitleWithHighlight
              title={article.title}
              highlight={article.highlight}
            />
          </h1>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {author.avatar && (
                <Image
                  src={author.avatar}
                  alt={author.name}
                  width={80}
                  height={80}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              )}
              <p className="text-sm text-meta">
                <span className="font-semibold text-ink">{author.name}</span>
                <span className="px-2" aria-hidden>
                  ·
                </span>
                {formatDate(article.date, lang)}
                <span className="px-2" aria-hidden>
                  ·
                </span>
                {readingMinutes(article)} {t("menit baca")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <ShareButtons title={article.title} />
            </div>
          </div>

          <figure className="mt-8">
            <Image
              src={articleImage(article, 1200, 675)}
              alt={article.title}
              width={1200}
              height={675}
              priority
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="aspect-video w-full rounded-xl object-cover saturate-[0.9]"
            />
          </figure>

          {article.excerpt && (
            <p className="mt-10 max-w-[62ch] text-xl font-medium leading-relaxed text-ink">
              {article.excerpt}
            </p>
          )}
          {article.bodyHtml ? (
            <div
              className="wp-body mt-7 space-y-6"
              dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
            />
          ) : (
            <div className="mt-7 space-y-6">
              {article.body.map((paragraph, i) => (
                <p
                  key={i}
                  className={`max-w-[62ch] text-[18px] leading-[1.8] text-ink/85 ${i === 0 ? "drop-cap" : ""}`}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          <EndMark className="mt-10 max-w-[62ch]" />

          {/* Kotak penulis */}
          <div className="mt-14 flex gap-5 rounded-xl border border-line bg-surface p-6">
            {author.avatar && (
              <Image
                src={author.avatar}
                alt={author.name}
                width={160}
                height={160}
                className="hidden h-20 w-20 shrink-0 rounded-xl object-cover sm:block"
              />
            )}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-meta">
                {t("Penulis")}
              </p>
              <p className="mt-1.5 font-display text-lg font-bold text-ink">
                {author.name}
              </p>
              <p className="text-sm text-meta">{author.role}</p>
              {author.bio && (
                <p className="mt-3 text-sm leading-relaxed">{author.bio}</p>
              )}
            </div>
          </div>

          {/* Navigasi artikel sebelumnya / selanjutnya */}
          {(prev || next) && (
            <nav
              aria-label={t("Navigasi artikel")}
              className="mt-14 grid gap-4 border-t border-line pt-8 sm:grid-cols-2"
            >
              {prev ? (
                <Link
                  href={l(articleHref(prev))}
                  className="group rounded-xl border border-line p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40"
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-meta">
                    <CaretLeft size={11} weight="bold" />
                    {t("Sebelumnya")}
                  </span>
                  <span className="mt-2 block font-display text-[15px] font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={l(articleHref(next))}
                  className="group rounded-xl border border-line p-5 text-right transition-all hover:-translate-y-0.5 hover:border-accent/40"
                >
                  <span className="flex items-center justify-end gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-meta">
                    {t("Selanjutnya")}
                    <CaretRight size={11} weight="bold" />
                  </span>
                  <span className="mt-2 block font-display text-[15px] font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
                    {next.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}

          {related.length > 0 && (
            <section className="mt-14" aria-label={t("Artikel terkait")}>
              <SectionHeading
                title={`${t("Lainnya di")} ${t(categoryName(parentCategory))}`}
                href={`/category/${parentCategory}`}
              />
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((a) => (
                  <CardFeature key={a.slug} article={a} withExcerpt={false} />
                ))}
              </div>
            </section>
          )}
        </article>

        <Sidebar polls={articlePolls} />
      </div>
    </div>
  );
}
