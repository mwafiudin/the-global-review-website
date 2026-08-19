import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { bookByline } from "@/data/books";
import { wpBooks } from "@/lib/wp/books";
import { getT } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Bedah Buku",
  description:
    "Ulasan buku-buku terbitan Global Future Institute dan bacaan pilihan redaksi.",
};

export default async function BedahBukuPage() {
  const [utama, ...lainnya] = await wpBooks();
  const { t, l } = await getT();

  return (
    <>
      <PageHeader
        title="Bedah Buku"
        lead={t("Ulasan buku terbitan Global Future Institute dan bacaan pilihan redaksi.")}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 pb-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          <div className="space-y-10">
            {/* Buku utama */}
            <Link
              href={l(`/bedah-buku/${utama.slug}`)}
              className="group grid gap-6 rounded-2xl border border-line bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:grid-cols-[210px_1fr] sm:gap-8 sm:p-8"
            >
              <Image
                src={utama.cover}
                alt={`Sampul buku ${utama.judul}`}
                width={1088}
                height={1452}
                sizes="210px"
                priority
                className="aspect-[3/4] w-full self-start rounded-lg bg-canvas object-cover shadow-sm"
              />
              <div className="flex flex-col">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                  {t("Buku Utama")}
                </p>
                <h2 className="mt-3 font-display text-2xl font-extrabold leading-snug tracking-tight text-ink transition-colors group-hover:text-accent">
                  {utama.judul}
                </h2>
                <p className="mt-2 text-sm text-meta">
                  {bookByline(utama)}
                </p>
                <p className="mt-4 text-[15px] leading-relaxed">
                  {utama.ringkasan}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                  {t("Baca ulasan lengkap")}
                  <ArrowRight
                    size={13}
                    weight="bold"
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </div>
            </Link>

            {/* Buku lainnya */}
            <div>
              <h2 className="mb-5 border-b border-line pb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
                {t("Koleksi Lainnya")}
              </h2>
              <div className="space-y-6">
                {lainnya.map((b) => (
                  <Link
                    key={b.slug}
                    href={l(`/bedah-buku/${b.slug}`)}
                    className="group flex gap-5 rounded-2xl border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:gap-6 sm:p-6"
                  >
                    <Image
                      src={b.cover}
                      alt={`Sampul buku ${b.judul}`}
                      width={1088}
                      height={1452}
                      sizes="120px"
                      className="aspect-[3/4] w-[88px] shrink-0 self-start rounded-md bg-canvas object-cover shadow-sm sm:w-[112px]"
                    />
                    <div className="flex flex-col">
                      <h3 className="font-display text-lg font-bold leading-snug text-ink transition-colors group-hover:text-accent">
                        {b.judul}
                      </h3>
                      <p className="mt-1.5 text-sm text-meta">
                        {bookByline(b)}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed">{b.ringkasan}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                        {t("Baca ulasan")}
                        <ArrowRight
                          size={13}
                          weight="bold"
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <Sidebar />
        </div>
      </div>
    </>
  );
}
