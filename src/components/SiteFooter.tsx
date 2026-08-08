"use client";

import Image from "next/image";
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

/** Segel monogram GFI — motif cincin + bintang kompas, senada logotype. */
function GfiSeal({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden className={className}>
      <circle cx="50" cy="50" r="47" stroke="#d9b14a" strokeWidth="1.4" />
      <circle
        cx="50"
        cy="50"
        r="40"
        stroke="#d9b14a"
        strokeWidth="0.7"
        opacity="0.55"
      />
      {/* bintang kompas 4 titik di atas */}
      <path
        d="M50 20 L52 27 L50 25.5 L48 27 Z"
        fill="#d9b14a"
      />
      <text
        x="50"
        y="57"
        textAnchor="middle"
        fontFamily="Cardo, Georgia, serif"
        fontSize="27"
        fontWeight="700"
        letterSpacing="1.5"
        fill="#d9b14a"
      >
        GFI
      </text>
      <text
        x="50"
        y="74"
        textAnchor="middle"
        fontFamily="Montserrat, sans-serif"
        fontSize="6.5"
        letterSpacing="2.5"
        fill="#d9b14a"
        opacity="0.85"
      >
        EST. 2007
      </text>
    </svg>
  );
}

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
  const { t } = useLang();
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
          <GfiSeal className="h-16 w-16 shrink-0" />
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
            href="/tentang-gfi"
            className="shrink-0 self-start rounded-lg border border-white/25 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:border-[#d9b14a] hover:text-[#d9b14a] sm:ml-auto sm:self-center"
          >
            {t("Tentang GFI")}
          </Link>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-14 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-6">
        <div>
          <Logo onDark />
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
                  href={item.href}
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
                  href={item.href}
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
