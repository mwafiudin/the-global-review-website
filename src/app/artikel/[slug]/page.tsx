import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { articles } from "@/data/articles";
import { getAuthor } from "@/data/authors";
import {
  adjacentArticles,
  articleHref,
  articleImage,
  byCategory,
  categoryName,
  formatDate,
  getArticle,
  readingMinutes,
} from "@/lib/articles";
import { pollsForArticle, toPollView } from "@/lib/polls";
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

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return { title: article.title, description: article.excerpt };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const author = getAuthor(article.author);
  const parentCategory = article.category.split("/")[0];
  const related = byCategory(parentCategory)
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);
  const { prev, next } = adjacentArticles(article);
  const articlePolls = pollsForArticle(article.slug).map(toPollView);

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
                {formatDate(article.date)}
                <span className="px-2" aria-hidden>
                  ·
                </span>
                {readingMinutes(article)} menit baca
              </p>
            </div>
            <ShareButtons title={article.title} />
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

          <p className="mt-10 max-w-[62ch] text-xl font-medium leading-relaxed text-ink">
            {article.excerpt}
          </p>
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
                Penulis
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
              aria-label="Navigasi artikel"
              className="mt-14 grid gap-4 border-t border-line pt-8 sm:grid-cols-2"
            >
              {prev ? (
                <Link
                  href={articleHref(prev)}
                  className="group rounded-xl border border-line p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40"
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-meta">
                    <CaretLeft size={11} weight="bold" />
                    Sebelumnya
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
                  href={articleHref(next)}
                  className="group rounded-xl border border-line p-5 text-right transition-all hover:-translate-y-0.5 hover:border-accent/40"
                >
                  <span className="flex items-center justify-end gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-meta">
                    Selanjutnya
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
            <section className="mt-14" aria-label="Artikel terkait">
              <SectionHeading
                title={`Lainnya di ${categoryName(parentCategory)}`}
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
