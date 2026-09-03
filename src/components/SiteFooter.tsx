"use client";

import Image from "@/components/ImageWithFallback";
import Link from "next/link";
import {
  EnvelopeSimple,
  FacebookLogo,
  MapPin,
  XLogo,
} from "@phosphor-icons/react/dist/ssr";
import { site } from "@/data/site";
import { useLang } from "@/lib/i18n";
import { Logo } from "./Logo";


/** Tautan kelembagaan (induk) vs media — dipisah agar hierarki jelas. */
const lembagaLinks = [
  { label: "Tentang Global Future Institute", href: "/tentang-gfi" },
  { label: "Pengurus GFI", href: "/pengurus-gfi" },
  { label: "Hubungi Kami", href: "/hubungi-kami" },
];

const mediaLinks = [
  { label: "Tentang Kami", href: "/tentang-tgr" },
  { label: "Redaksi", href: "/redaksi" },
  { label: "Bedah Buku", href: "/bedah-buku" },
  { label: "Galeri", href: "/gallery" },
  { label: "Podcast", href: "/podcast" },
];

/**
 * Footer gelap yang menyatu dengan CTA buletin di atasnya (satu blok navy
 * penutup, dark-neutral di dark mode). Baris "Diterbitkan oleh" menegaskan
 * bahwa The Global Review adalah kanal media milik Global Future Institute.
 */
export function SiteFooter() {
  const { t, l } = useLang();
  return (
    <footer className="relative overflow-hidden bg-[#011840] text-white/70 dark:bg-[#18181b]">
      {/* Peta dunia engraving: motif "pemandu" samar */}
      <Image
        src="/images/peta-dunia-engraving-antik.jpg"
        alt=""
        width={1536}
        height={1024}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-full w-full object-cover opacity-[0.07] mix-blend-screen"
      />

      {/* Penekanan relasi: diterbitkan oleh GFI */}
      <div className="relative border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center lg:px-6">
          {/* Logo GFI yang asli, lengkap dengan wordmark-nya.

              Ditempatkan di atas keping putih karena logonya biru-navy dan
              wordmark-nya hitam, sedangkan footer ini berlatar navy — tanpa
              keping itu separuh bentuk dan seluruh teksnya lenyap. Keping
              putih menjaga warna brand persis seperti aslinya, tanpa perlu
              mewarnai ulang logo milik klien.

              Isi logo hanya menempati 71% tinggi keping — sisanya ruang
              napas yang dibakukan ke dalam asetnya, bukan diatur lewat CSS,
              supaya keping ini tetap proporsional di mana pun ia dipakai.

              Konsekuensinya wordmark mengecil: tinggi huruf kapitalnya hanya
              6% dari tinggi isi, jadi pada keping 104px ia berada di ambang
              terbaca. Ia memang berperan sebagai bagian dari lambang, bukan
              teks yang dibaca — nama lembaganya tetap tertulis utuh di
              sebelahnya. */}
          <Image
            src="/images/logo-global-future-institute.png"
            alt="Logo Global Future Institute"
            width={930}
            height={805}
            className="h-[104px] w-auto shrink-0 rounded-xl"
          />
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#d9b14a]">
              {t("Diterbitkan oleh")}
            </p>
            <p className="mt-1.5 font-display text-lg font-bold text-white">
              Global Future Institute (GFI)
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-white/60">
              {t(
                "Lembaga pengkajian geopolitik dan politik luar negeri, berdiri 11 Oktober 2007."
              )}{" "}
              <span className="text-white/85">The Global Review</span>{" "}
              {t("adalah kanal jurnalistiknya.")}
            </p>
          </div>
          <Link
            href={l("/tentang-gfi")}
            className="shrink-0 self-start rounded-lg border border-white/25 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:border-[#d9b14a] hover:text-[#d9b14a] sm:ml-auto sm:self-center"
          >
            {t("Tentang GFI")}
          </Link>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-14 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-6">
        <div>
          <Logo onDark homeHref={l("/")} />
          <p className="mt-6 font-display text-lg font-semibold leading-snug text-white/85">
            {t(site.tagline)}
          </p>
          <div className="mt-7 space-y-3 text-sm">
            <p className="flex max-w-xs items-start gap-2.5 leading-relaxed text-white/55">
              <MapPin
                size={15}
                weight="regular"
                className="mt-[3px] shrink-0 text-[#d9b14a]"
              />
              <span className="text-pretty">{site.address}</span>
            </p>
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center gap-2.5 text-sm text-white/60 transition-colors hover:text-white"
            >
              <EnvelopeSimple
                size={15}
                weight="regular"
                className="shrink-0 text-[#d9b14a]"
              />
              {site.email}
            </a>
          </div>
        </div>

        <nav aria-label="Tautan lembaga">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d9b14a]">
            {t("Lembaga")}
          </h2>
          <ul className="mt-5 space-y-2.5">
            {lembagaLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={l(item.href)}
                  className="text-sm text-white/70 transition-colors hover:text-white"
                >
                  {t(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Tautan media dan rubrik">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d9b14a]">
            {t("Media")}
          </h2>
          <ul className="mt-5 space-y-2.5">
            {mediaLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={l(item.href)}
                  className="text-sm text-white/70 transition-colors hover:text-white"
                >
                  {t(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row lg:px-6">
          <p className="text-xs text-white/45">{site.copyright}</p>
          <div className="flex items-center gap-1">
            <a
              href={site.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook The Global Review"
              className="flex h-8 w-8 items-center justify-center text-white/55 transition-colors hover:text-white"
            >
              <FacebookLogo size={16} weight="regular" />
            </a>
            <a
              href={site.social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X / Twitter The Global Review"
              className="flex h-8 w-8 items-center justify-center text-white/55 transition-colors hover:text-white"
            >
              <XLogo size={16} weight="regular" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
