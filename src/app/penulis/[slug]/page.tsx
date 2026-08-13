import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { authors, getAuthor } from "@/data/authors";
import { byAuthor, byAuthorCount } from "@/lib/wp/articles";
import { Avatar } from "@/components/Avatar";
import { CardRow } from "@/components/ArticleCard";

/** Kosong: profil penulis on-demand + ISR; gerbang notFound menjaga slug liar. */
export function generateStaticParams(): { slug: string }[] {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = authors.find((a) => a.slug === slug);
  if (!author) notFound();
  return {
    title: `${author.name} — Penulis`,
    description: author.bio ?? `Kumpulan tulisan ${author.name} di The Global Review.`,
  };
}

export default async function PenulisPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!authors.some((a) => a.slug === slug)) notFound();

  const author = getAuthor(slug);
  const [artikel, totalTulisan] = await Promise.all([
    byAuthor(slug),
    byAuthorCount(slug),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:py-20">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-[0.14em] text-meta">
          <li>
            <Link href="/redaksi" className="transition-colors hover:text-accent">
              Redaksi
            </Link>
          </li>
          <li className="flex items-center gap-2">
            <CaretRight size={10} weight="bold" aria-hidden />
            <span className="text-ink">{author.name}</span>
          </li>
        </ol>
      </nav>

      {/* Profil penulis */}
      <div className="mt-6 flex items-start gap-5">
        <Avatar name={author.name} src={author.avatar} className="h-20 w-20" />
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
            {author.name}
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-accent">
            {author.role}
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wider text-meta">
            {totalTulisan} tulisan
          </p>
        </div>
      </div>
      {author.bio && (
        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-body">
          {author.bio}
        </p>
      )}

      {/* Daftar tulisan */}
      <h2 className="mb-2 mt-12 border-b border-line pb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
        Tulisan Terbaru
      </h2>
      {artikel.length > 0 ? (
        <div className="divide-y divide-line">
          {artikel.map((a) => (
            <CardRow key={a.slug} article={a} />
          ))}
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-meta">
          Belum ada tulisan.
        </p>
      )}

      <Link
        href="/redaksi"
        className="mt-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent transition-opacity hover:opacity-70"
      >
        <ArrowLeft size={13} weight="bold" />
        Kembali ke Redaksi
      </Link>
    </div>
  );
}
