import Image from "next/image";
import Link from "next/link";
import { Article } from "@/lib/types";
import {
  articleHref,
  articleImage,
  categoryHref,
  categoryName,
  formatDate,
  readingMinutes,
} from "@/lib/articles";

/** Label kategori: tipografi uppercase kecil, tenang. */
export function CategoryTag({
  slug,
  onImage = false,
}: {
  slug: string;
  onImage?: boolean;
}) {
  return (
    <Link
      href={categoryHref(slug)}
      className={
        onImage
          ? "inline-block text-[10px] font-bold uppercase tracking-[0.14em] text-white/80 transition-colors hover:text-white"
          : "inline-block text-[10px] font-bold uppercase tracking-[0.14em] text-meta transition-colors hover:text-accent"
      }
    >
      {categoryName(slug)}
    </Link>
  );
}

/**
 * Menyorot satu frasa kunci judul dengan coretan penanda (stabilo).
 * hover=false → selalu tampil (hero/berita utama).
 * hover=true  → disingkap saat kartu induk (.group) dihover / fokus.
 */
export function TitleWithHighlight({
  title,
  highlight,
  hover = false,
}: {
  title: string;
  highlight?: string;
  hover?: boolean;
}) {
  if (!highlight || !title.includes(highlight)) return <>{title}</>;
  const [before, after] = title.split(highlight);
  return (
    <>
      {before}
      <span className={`mk ${hover ? "mk--hover" : "mk--on"}`}>
        <span className="mk__base">{highlight}</span>
        <span className="mk__fill" aria-hidden="true">
          <span className="mk__fillinner">{highlight}</span>
        </span>
      </span>
      {after}
    </>
  );
}

/** Kartu fitur: gambar di atas, teks di bawah. */
export function CardFeature({
  article,
  withExcerpt = true,
}: {
  article: Article;
  withExcerpt?: boolean;
}) {
  return (
    <article className="group transition-transform duration-200 hover:-translate-y-0.5">
      <Link
        href={articleHref(article)}
        className="block aspect-[16/10] w-full self-start overflow-hidden rounded-xl bg-canvas"
        tabIndex={-1}
        aria-hidden
      >
        <Image
          src={articleImage(article, 720, 450)}
          alt={article.title}
          width={720}
          height={450}
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="h-full w-full object-cover saturate-50 transition-[filter] duration-300 group-hover:saturate-100"
        />
      </Link>
      <div className="pt-5">
        <CategoryTag slug={article.category} />
        <h3 className="mt-2.5 font-display text-lg font-bold leading-snug tracking-tight text-ink">
          <Link href={articleHref(article)}>
            <TitleWithHighlight
              title={article.title}
              highlight={article.highlight}
              hover
            />
          </Link>
        </h3>
        {withExcerpt && (
          <p className="mt-2.5 line-clamp-2 text-[15px] leading-relaxed text-body">
            {article.excerpt}
          </p>
        )}
        <p className="mt-3 text-xs text-meta">{formatDate(article.date)} · {readingMinutes(article)} menit baca</p>
      </div>
    </article>
  );
}

/** Kartu ringkas: thumbnail di kiri, judul tegas untuk daftar samping. */
export function CardCompact({ article }: { article: Article }) {
  return (
    <article className="group flex items-start gap-4">
      <Link
        href={articleHref(article)}
        className="block aspect-[4/3] w-[116px] shrink-0 self-start overflow-hidden rounded-lg bg-surface"
        tabIndex={-1}
        aria-hidden
      >
        <Image
          src={articleImage(article, 260, 200)}
          alt={article.title}
          width={116}
          height={88}
          sizes="116px"
          className="h-full w-full object-cover saturate-[0.25] transition-[filter] duration-300 group-hover:saturate-100"
        />
      </Link>
      <div className="min-w-0">
        <CategoryTag slug={article.category} />
        <h3 className="mt-1.5 line-clamp-2 font-display text-[17px] font-bold leading-snug tracking-tight text-ink">
          <Link href={articleHref(article)}>
            <TitleWithHighlight
              title={article.title}
              highlight={article.highlight}
              hover
            />
          </Link>
        </h3>
        <p className="mt-2 text-xs text-meta">{formatDate(article.date)}</p>
      </div>
    </article>
  );
}

/** Item teks murni untuk daftar samping hero. */
export function CardHeadline({ article }: { article: Article }) {
  return (
    <article className="group">
      <CategoryTag slug={article.category} />
      <h3 className="mt-1.5 font-display text-[15px] font-semibold leading-snug text-ink">
        <Link href={articleHref(article)}>
          <TitleWithHighlight
            title={article.title}
            highlight={article.highlight}
            hover
          />
        </Link>
      </h3>
      <p className="mt-1.5 text-xs text-meta">{formatDate(article.date)}</p>
    </article>
  );
}

/** Kartu baris: horizontal dengan excerpt, untuk feed berita. */
export function CardRow({ article }: { article: Article }) {
  return (
    <article className="group grid gap-5 py-8 first:pt-0 sm:grid-cols-[220px_1fr] sm:gap-7">
      <Link
        href={articleHref(article)}
        className="block aspect-[3/2] w-full self-start overflow-hidden rounded-xl bg-canvas"
        tabIndex={-1}
        aria-hidden
      >
        <Image
          src={articleImage(article, 480, 320)}
          alt={article.title}
          width={480}
          height={320}
          sizes="(min-width: 640px) 220px, 100vw"
          className="h-full w-full object-cover saturate-[0.25] transition-[filter] duration-300 group-hover:saturate-100"
        />
      </Link>
      <div>
        <CategoryTag slug={article.category} />
        <h3 className="mt-2 font-display text-xl font-bold leading-snug tracking-tight text-ink">
          <Link href={articleHref(article)}>
            <TitleWithHighlight
              title={article.title}
              highlight={article.highlight}
              hover
            />
          </Link>
        </h3>
        <p className="mt-2.5 line-clamp-2 text-[15px] leading-relaxed text-body">
          {article.excerpt}
        </p>
        <p className="mt-3 text-xs text-meta">{formatDate(article.date)} · {readingMinutes(article)} menit baca</p>
      </div>
    </article>
  );
}
