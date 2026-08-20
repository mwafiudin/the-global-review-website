import type { Metadata } from "next";
import {
  ArrowRight,
  ChatCircleText,
  Clock,
  EnvelopeSimple,
  FacebookLogo,
  Handshake,
  MapPin,
  Newspaper,
  XLogo,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/PageHeader";
import { ContactForm } from "@/components/ContactForm";
import { Fragment } from "react";
import { hubungiKamiCopy } from "@/data/pages/hubungi-kami";
import { site } from "@/data/site";
import { getLang } from "@/lib/i18n-server";
import { DEFAULT_LANG, isLocale } from "@/lib/locale-routing";
import { dwibahasa } from "@/lib/seo";
import { wpHubungi } from "@/lib/wp/halaman";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const copy = hubungiKamiCopy[isLocale(lang) ? lang : DEFAULT_LANG];
  const bahasa = isLocale(lang) ? lang : DEFAULT_LANG;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    // Tersedia penuh di dua bahasa: pasangan hreflang timbal balik.
    alternates: dwibahasa(bahasa, "/hubungi-kami"),
  };
}

/** Ikon kanal, urutannya sejajar dengan hubungiKamiCopy[lang].kanal. */
const kanalIcons = [Newspaper, Handshake, ChatCircleText];

const mail = (subjek: string) =>
  `mailto:${site.email}?subject=${encodeURIComponent(subjek)}`;

export default async function HubungiKamiPage() {
  const { copy, alamat, petaQ } = await wpHubungi(await getLang());
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
    petaQ
  )}&z=15&output=embed`;
  return (
    <>
      <PageHeader title={copy.title} icon={ChatCircleText} lead={copy.lead} />
      <div className="mx-auto max-w-7xl px-4 py-10 pb-20">
        {/* Kanal per tujuan */}
        <div className="grid gap-4 sm:grid-cols-3">
          {copy.kanal.map((k, i) => {
            const Icon = kanalIcons[i];
            return (
              <a
                key={k.judul}
                href={k.subjek ? mail(k.subjek) : "#form"}
                className="group flex flex-col rounded-2xl border border-line bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-accent ring-1 ring-inset ring-line">
                  <Icon size={20} weight="regular" />
                </span>
                <p className="mt-4 font-display text-base font-bold text-ink">
                  {k.judul}
                </p>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-body">
                  {k.teks}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                  {k.aksi}
                  <ArrowRight
                    size={13}
                    weight="bold"
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </a>
            );
          })}
        </div>

        {/* Form + info */}
        <div
          id="form"
          className="mt-12 grid scroll-mt-24 gap-12 lg:grid-cols-[1fr_380px]"
        >
          <div>
            <h2 className="mb-6 border-b border-line pb-4 text-xs font-bold uppercase tracking-[0.16em] text-ink md:text-sm">
              {copy.kirimHeading}
            </h2>
            <ContactForm />
          </div>

          <aside className="space-y-4">
            {/* Peta lokasi */}
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <iframe
                src={mapSrc}
                title={copy.petaTitle}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="aspect-[4/3] w-full grayscale-[0.3]"
              />
            </div>

            {/* Alamat */}
            <div className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
              <MapPin size={20} weight="regular" className="shrink-0 text-brand" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink">
                  {copy.alamatLabel}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-body">
                  {alamat.map((baris, i) => (
                    <Fragment key={baris}>
                      {i > 0 && <br />}
                      {baris}
                    </Fragment>
                  ))}
                </p>
              </div>
            </div>

            {/* Surel */}
            <div className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
              <EnvelopeSimple
                size={20}
                weight="regular"
                className="shrink-0 text-brand"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink">
                  {copy.surelLabel}
                </p>
                <a
                  href={`mailto:${site.email}`}
                  className="mt-1.5 block break-all text-sm text-body transition-colors hover:text-accent"
                >
                  {site.email}
                </a>
              </div>
            </div>

            {/* Jam operasional */}
            <div className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
              <Clock size={20} weight="regular" className="shrink-0 text-brand" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink">
                  {copy.jamLabel}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-body">
                  {copy.jamTeks}
                </p>
              </div>
            </div>

            {/* Sosial */}
            <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink">
                {copy.ikutiLabel}
              </p>
              <div className="flex items-center gap-1">
                {[
                  {
                    href: site.social.facebook,
                    Icon: FacebookLogo,
                    label: "Facebook",
                  },
                  { href: site.social.twitter, Icon: XLogo, label: "X" },
                ].map(({ href, Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-meta transition-colors hover:bg-canvas hover:text-accent"
                  >
                    <Icon size={17} weight="regular" />
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
