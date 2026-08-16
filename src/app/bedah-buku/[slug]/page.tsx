import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { bookImprint } from "@/data/books";
import { wpBook, wpBooks } from "@/lib/wp/books";
import { wpPodcast } from "@/lib/wp/podcasts";
import { VideoEmbed } from "@/components/VideoEmbed";
import { EndMark } from "@/components/Ornaments";

/** Kosong dengan sengaja: halaman ber-WordPress dirender on-demand + ISR. */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await wpBook(slug);
  if (!book) return {};
  return {
    title: `Ulasan: ${book.judul}`,
    description: book.ringkasan,
    // Ulasannya juga tayang sebagai tulisan biasa di /{slug} — itulah URL
    // yang sudah terindeks. Halaman ini bentuk sajian lain dari isi yang
    // sama, jadi jangan ikut diindeks agar tidak bersaing dengan aslinya.
    robots: { index: false, follow: true },
  };
}

export default async function BookReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const semua = await wpBooks();
  const book = semua.find((b) => b.slug === slug);
  if (!book) notFound();

  // Lewat lapisan WordPress, bukan data contoh: /podcast/{slug} me-resolve
  // dari sana, jadi tautan ke slug yang tak ada di sana akan berujung 404.
  const podcast = book.podcastTerkait
    ? await wpPodcast(book.podcastTerkait)
    : undefined;
  // Kini koleksinya puluhan, bukan empat: seksi penutup dibatasi agar tidak
  // berubah jadi daftar panjang di bawah setiap ulasan.
  const lainnya = semua.filter((b) => b.slug !== book.slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 md:py-20">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-[0.14em] text-meta">
          <li>
            <Link
              href="/bedah-buku"
              className="transition-colors hover:text-accent"
            >
              Bedah Buku
            </Link>
          </li>
          <li className="flex items-center gap-2">
            <CaretRight size={10} weight="bold" aria-hidden />
            <span className="text-ink">Ulasan</span>
          </li>
        </ol>
      </nav>

      {/* Header: sampul + judul */}
      <div className="mt-6 grid gap-8 sm:grid-cols-[200px_1fr]">
        <Image
          src={book.cover}
          alt={`Sampul buku ${book.judul}`}
          width={1088}
          height={1452}
          sizes="200px"
          priority
          className="aspect-[3/4] w-full self-start rounded-lg bg-canvas object-cover shadow-md"
        />
        <div className="flex flex-col">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            Bedah Buku
          </p>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
            {book.judul}
          </h1>
          <p className="mt-4 text-sm font-semibold text-accent">
            {book.penulis}
          </p>
          {/* Ulasan dari kategori WordPress belum tentu punya penerbit —
              barisnya dihilangkan, bukan dibiarkan kosong berjarak. */}
          {bookImprint(book) && (
            <p className="mt-1 text-sm text-meta">{bookImprint(book)}</p>
          )}
          {book.isbn && (
            <p className="mt-1 text-xs text-meta">ISBN {book.isbn}</p>
          )}
          <p className="mt-5 text-[15px] italic leading-relaxed text-body">
            {book.ringkasan}
          </p>
          {book.penulisLengkap && (
            <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-meta">
              <span className="font-semibold uppercase tracking-wider text-ink">
                Penulis
              </span>
              <br />
              {book.penulisLengkap}
            </p>
          )}
        </div>
      </div>

      {/* Ulasan lengkap */}
      <article className="mt-10 max-w-[68ch] space-y-5 text-[17px] leading-relaxed text-body">
        {book.ulasan.map((p, i) => (
          <p key={i} className={i === 0 ? "drop-cap" : undefined}>
            {p}
          </p>
        ))}
      </article>

      {/* Video terkait */}
      {podcast && (
        <div className="mt-12 border-t border-line pt-10">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
            Tonton diskusinya
          </h2>
          <p className="mt-2 text-sm text-meta">
            {podcast.format} bersama {podcast.narasumber} di {podcast.media}.
          </p>
          <div className="mt-5">
            <VideoEmbed id={podcast.videoId} title={podcast.headline} />
          </div>
          <Link
            href={`/podcast/${podcast.slug}`}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent transition-opacity hover:opacity-70"
          >
            Selengkapnya di Podcast
            <CaretRight size={12} weight="bold" />
          </Link>
        </div>
      )}

      <EndMark className="mt-12" />

      {/* Buku lainnya */}
      <div className="mt-12 border-t border-line pt-10">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
          Ulasan lainnya
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lainnya.map((b) => (
            <Link
              key={b.slug}
              href={`/bedah-buku/${b.slug}`}
              className="group flex gap-5 rounded-xl border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <Image
                src={b.cover}
                alt={`Sampul buku ${b.judul}`}
                width={1088}
                height={1452}
                sizes="80px"
                className="aspect-[3/4] w-[72px] shrink-0 self-start rounded-md bg-canvas object-cover shadow-sm"
              />
              <div>
                <h3 className="font-display text-base font-bold leading-snug text-ink transition-colors group-hover:text-accent">
                  {b.judul}
                </h3>
                <p className="mt-1 text-xs text-meta">
                  {b.penulis}
                  {b.tahun ? `, ${b.tahun}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/bedah-buku"
          className="mt-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent transition-opacity hover:opacity-70"
        >
          <ArrowLeft size={13} weight="bold" />
          Semua bedah buku
        </Link>
      </div>
    </div>
  );
}
