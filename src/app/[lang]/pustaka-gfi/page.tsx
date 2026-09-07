import type { Metadata } from "next";
import Image from "@/components/ImageWithFallback";
import Link from "next/link";
import { ArrowRight, BookOpen } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { bookImprint } from "@/data/books";
import { pustakaGfi } from "@/lib/wp/books";
import { getT } from "@/lib/i18n-server";
import { DEFAULT_LANG, isLocale } from "@/lib/locale-routing";
import { kanonik, robotsEn } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const bahasa = isLocale(lang) ? lang : DEFAULT_LANG;
  return {
    title: bahasa === "en" ? "GFI Library" : "Pustaka GFI",
    description:
      bahasa === "en"
        ? "Books written and compiled by Global Future Institute researchers."
        : "Buku-buku yang ditulis dan disusun para pengkaji Global Future Institute.",
    robots: robotsEn(bahasa),
    alternates: kanonik(bahasa, "/pustaka-gfi"),
  };
}

const LEAD =
  "Buku yang ditulis dan disusun para pengkaji Global Future Institute.";

export default async function PustakaGfiPage() {
  const buku = await pustakaGfi();
  const { t, l } = await getT();

  return (
    <>
      <PageHeader title="Pustaka GFI" lead={t(LEAD)} />
      <div className="mx-auto max-w-7xl px-4 py-10 pb-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          <div>
            {/* Pembeda dari Bedah Buku dinyatakan terang-terangan: dua kanal
                ini sama-sama tentang buku dan mudah tertukar. */}
            <p className="mb-8 max-w-2xl border-l-2 border-accent/40 pl-4 text-sm leading-relaxed text-meta">
              {t(
                "Halaman ini memuat karya sendiri. Ulasan buku dari penerbit lain ada di"
              )}{" "}
              <Link
                href={l("/bedah-buku")}
                className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:text-accent"
              >
                {t("Bedah Buku")}
              </Link>
              .
            </p>

            {buku.length === 0 ? (
              // Keadaan kosong yang jujur: penandanya centang "Karya GFI" di
              // wp-admin, jadi kosong berarti belum ditandai — bukan putus.
              <div className="rounded-xl border border-dashed border-line px-6 py-16 text-center">
                <BookOpen
                  size={30}
                  weight="light"
                  className="mx-auto mb-4 text-meta"
                />
                <p className="font-display text-lg font-bold text-ink">
                  {t("Belum ada buku yang ditandai")}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-meta">
                  {t(
                    "Buku tampil di sini setelah ditandai Karya GFI pada Identitas Buku di wp-admin."
                  )}
                </p>
              </div>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
                {buku.map((b) => (
                  <Link
                    key={b.slug}
                    href={l(`/bedah-buku/${b.slug}`)}
                    className="group flex flex-col"
                  >
                    {/* Sampul jadi tokoh utama — ini katalog karya, bukan
                        daftar ulasan seperti Bedah Buku. */}
                    <Image
                      src={b.cover}
                      alt={`Sampul buku ${b.judul}`}
                      width={1088}
                      height={1452}
                      sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 90vw"
                      className="aspect-[3/4] w-full rounded-lg bg-canvas object-cover shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg"
                    />
                    <h2 className="mt-5 font-display text-lg font-bold leading-snug text-ink transition-colors group-hover:text-accent">
                      {b.judul}
                    </h2>
                    <p className="mt-1.5 text-sm text-meta">{b.penulis}</p>
                    {/* Penerbit tampil apa adanya: tidak semua karya GFI
                        terbit lewat GFI sendiri, dan mengaburkannya keliru. */}
                    {b.penerbit && (
                      <p className="mt-0.5 text-xs text-meta">
                        {bookImprint(b)}
                      </p>
                    )}
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed">
                      {b.ringkasan}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                      {t("Baca ulasan")}
                      <ArrowRight
                        size={13}
                        weight="bold"
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Sidebar />
        </div>
      </div>
    </>
  );
}
