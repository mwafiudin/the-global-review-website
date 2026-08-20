import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowsClockwise,
  Buildings,
  EnvelopeSimple,
  LockSimple,
  MagnifyingGlass,
  MapPin,
  PaperPlaneTilt,
  PenNib,
  Scales,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { Avatar } from "@/components/Avatar";
import { authors } from "@/data/authors";
import { redaksiCopy } from "@/data/pages/redaksi";
import { site } from "@/data/site";
import { getT } from "@/lib/i18n-server";
import { DEFAULT_LANG, isLocale } from "@/lib/locale-routing";
import { dwibahasa } from "@/lib/seo";
import { byAuthorCount } from "@/lib/wp/articles";
import { wpMasthead } from "@/lib/wp/orang";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const copy = redaksiCopy[isLocale(lang) ? lang : DEFAULT_LANG];
  const bahasa = isLocale(lang) ? lang : DEFAULT_LANG;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    // Tersedia penuh di dua bahasa: pasangan hreflang timbal balik.
    alternates: dwibahasa(bahasa, "/redaksi"),
  };
}

/** Ikon pedoman, urutannya sejajar dengan redaksiCopy[lang].pedoman. */
const pedomanIcons = [Scales, MagnifyingGlass, ArrowsClockwise, LockSimple];

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 border-b border-line pb-4 text-xs font-bold uppercase tracking-[0.16em] text-ink md:text-sm">
      {children}
    </h2>
  );
}

export default async function RedaksiPage() {
  const { lang, l } = await getT();
  const copy = redaksiCopy[lang];
  const masthead = (await wpMasthead())[lang];
  const kontributor = (
    await Promise.all(
      authors.map(async (a) => ({ ...a, jumlah: await byAuthorCount(a.slug) }))
    )
  ).sort((a, b) => b.jumlah - a.jumlah);

  return (
    <>
      <PageHeader title={copy.title} icon={PenNib} lead={copy.lead} />
      <div className="mx-auto max-w-7xl px-4 py-10 pb-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          <div className="space-y-16">
            {/* Tautan silang: perjelas beda dengan Pengurus GFI */}
            <Link
              href={l("/pengurus-gfi")}
              className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent/40"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-canvas text-accent ring-1 ring-inset ring-line">
                <Buildings size={20} weight="regular" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-snug text-body">
                  {copy.silangA}{" "}
                  <span className="font-semibold text-ink">{copy.silangTebal1}</span>
                  {copy.silangB}{" "}
                  <span className="font-semibold text-ink">{copy.silangTebal2}</span>
                  .
                </p>
              </div>
              <ArrowRight
                size={16}
                weight="bold"
                className="shrink-0 text-accent transition-transform group-hover:translate-x-1"
              />
            </Link>

            {/* Susunan redaksi — gaya colophon */}
            <section>
              <Heading>{copy.susunanHeading}</Heading>
              <dl className="overflow-hidden rounded-2xl border border-line bg-surface">
                {masthead.map((m, i) => (
                  <div
                    key={m.peran}
                    className={`flex flex-col gap-1 px-6 py-5 sm:flex-row sm:items-baseline sm:justify-between ${
                      i > 0 ? "border-t border-line" : ""
                    }`}
                  >
                    <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-meta">
                      {m.peran}
                    </dt>
                    <dd className="font-display text-lg font-bold text-ink sm:text-right">
                      {m.nama}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Kontributor — data nyata, tautan ke arsip tulisan */}
            <section>
              <Heading>{copy.kontributorHeading}</Heading>
              <div className="grid gap-3 sm:grid-cols-2">
                {kontributor.map((k) => (
                  <Link
                    key={k.slug}
                    href={l(`/penulis/${k.slug}`)}
                    className="group flex items-center gap-4 rounded-xl border border-line bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <Avatar name={k.name} src={k.avatar} className="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-bold leading-snug text-ink transition-colors group-hover:text-accent">
                        {k.name}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-meta">
                        {copy.beat[k.slug] ?? copy.beatFallback}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="block font-display text-xl font-extrabold text-accent">
                        {k.jumlah}
                      </span>
                      <span className="block text-[10px] uppercase tracking-wider text-meta">
                        {copy.tulisanLabel}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Pedoman redaksi */}
            <section>
              <Heading>{copy.pedomanHeading}</Heading>
              <div className="grid gap-4 sm:grid-cols-2">
                {copy.pedoman.map((p, i) => {
                  const Icon = pedomanIcons[i];
                  return (
                    <div
                      key={p.judul}
                      className="rounded-xl border border-line bg-surface p-6"
                    >
                      <Icon size={24} weight="light" className="text-brand" />
                      <p className="mt-4 font-display text-base font-bold text-ink">
                        {p.judul}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-body">
                        {p.teks}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Hubungi redaksi / kirim tulisan */}
            <section className="relative overflow-hidden rounded-2xl border border-line bg-surface p-8">
              <Image
                src="/tgr-gold-compass.svg"
                alt=""
                width={220}
                height={222}
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 opacity-[0.06]"
              />
              <div className="relative">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                  {copy.ctaKicker}
                </p>
                <h2 className="mt-3 max-w-md font-display text-2xl font-extrabold tracking-tight text-ink">
                  {copy.ctaHeading}
                </h2>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-body">
                  {copy.ctaTeks}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <a
                    href={`mailto:${site.email}?subject=${encodeURIComponent(
                      copy.subjekKiriman
                    )}`}
                    className="group inline-flex items-center gap-2 rounded-lg bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-surface transition-colors hover:bg-accent active:scale-[0.98]"
                  >
                    <PaperPlaneTilt size={15} weight="fill" />
                    {copy.ctaKirim}
                    <ArrowRight
                      size={13}
                      weight="bold"
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </a>
                  <a
                    href={`mailto:${site.email}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-body transition-colors hover:text-accent"
                  >
                    <EnvelopeSimple size={15} weight="regular" />
                    {site.email}
                  </a>
                </div>
                <p className="mt-6 flex items-start gap-2 border-t border-line pt-5 text-sm leading-relaxed text-meta">
                  <MapPin
                    size={16}
                    weight="regular"
                    className="mt-0.5 shrink-0"
                  />
                  {site.address}
                </p>
              </div>
            </section>
          </div>
          <Sidebar />
        </div>
      </div>
    </>
  );
}
