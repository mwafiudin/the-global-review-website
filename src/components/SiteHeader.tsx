"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Article,
  Atom,
  BookOpen,
  CaretDown,
  ChartBar,
  ChartLineUp,
  Compass,
  FacebookLogo,
  FilmSlate,
  GlobeHemisphereWest,
  Handshake,
  Heartbeat,
  type Icon,
  ImagesSquare,
  Leaf,
  List,
  MaskHappy,
  Microphone,
  Scales,
  ShieldCheck,
  UserFocus,
  UsersThree,
  X,
  XLogo,
} from "@phosphor-icons/react";
import { lainnyaGroups, mainMenu, site, topBarMenu } from "@/data/site";
import { useLang } from "@/lib/i18n";
import { alternatePath } from "@/lib/locale-routing";
import { Logo } from "./Logo";
import { LanguageToggle } from "./LanguageToggle";
import { SearchTrigger } from "./Search";
import { ThemeToggle } from "./ThemeToggle";

// Ikon per rubrik agar menu lebih ramah dibaca.
const iconByHref: Record<string, Icon> = {
  "/category/analisis": ChartLineUp,
  "/category/internasional": GlobeHemisphereWest,
  "/category/geopolitik": Compass,
  "/category/politik-keamanan": ShieldCheck,
  "/category/ekonomi-bisnis": ChartBar,
  "/category/diplomasi": Handshake,
  "/category/hukum": Scales,
  "/category/sosial": UsersThree,
  "/category/budaya": MaskHappy,
  "/category/lingkungan-hidup": Leaf,
  "/category/sains-teknologi": Atom,
  "/category/kesehatan": Heartbeat,
  "/category/sorot-tokoh": UserFocus,
  "/category/features": Article,
  "/category/media": FilmSlate,
  "/bedah-buku": BookOpen,
  "/podcast": Microphone,
  "/gallery": ImagesSquare,
};
const iconFor = (href: string): Icon => iconByHref[href] ?? Article;

// Menu "Tentang" untuk mobile: tanpa format yang sudah tampil di grup Kanal.
const lainnyaHrefs = new Set(
  lainnyaGroups.flatMap((g) => g.items.map((i) => i.href))
);
const tentangMobile = topBarMenu.filter((i) => !lainnyaHrefs.has(i.href));

const social = [
  { href: site.social.facebook, Icon: FacebookLogo, label: "Facebook" },
  { href: site.social.twitter, Icon: XLogo, label: "X" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const pathname = usePathname();
  const { t, l } = useLang();

  // Href menu selalu tanpa prefiks; pathname di /en dipulangkan dulu
  // supaya penanda aktif tetap benar di kedua bahasa.
  const path = alternatePath(pathname, "id");
  const isActive = (href: string) =>
    href !== "#" && (href === "/" ? path === "/" : path.startsWith(href));

  function closeMobile() {
    setMobileOpen(false);
    setOpenSub(null);
  }

  // Kunci scroll body saat overlay menu terbuka
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Utility bar + nav utama menempel bersama agar Tentang selalu terlihat */}
      <div className="sticky top-0 z-50">
        {/* Utility bar (desktop): akses cepat + pemindah bahasa */}
        <div className="hidden border-b border-line bg-surface xl:block">
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-2">
              {social.map(({ href, Icon: SocialIcon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-meta transition-colors hover:text-accent"
                >
                  <SocialIcon size={14} weight="regular" />
                </a>
              ))}
            </div>
            <div className="flex items-center gap-5">
              <nav aria-label="Menu tentang" className="flex items-center gap-5">
                {topBarMenu.map((item) => (
                  <Link
                    key={item.href}
                    href={l(item.href)}
                    className={`text-[11px] font-semibold uppercase tracking-wide transition-colors hover:text-accent ${
                      isActive(item.href) ? "text-accent" : "text-meta"
                    }`}
                  >
                    {t(item.label)}
                  </Link>
                ))}
              </nav>
              <span className="h-3.5 w-px bg-line" aria-hidden />
              <LanguageToggle withIcon />
            </div>
          </div>
        </div>

        <header className="border-b border-line bg-canvas/85 backdrop-blur-md">
          <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-4 lg:px-6">
            <Logo withTagline homeHref={l("/")} />

            {/* Nav desktop */}
            <nav aria-label="Menu utama" className="hidden xl:block">
              <ul className="flex items-center gap-1">
                {mainMenu.map((item) => (
                  <li key={item.label} className="group relative">
                    <Link
                      href={l(item.href)}
                      className={`flex h-[72px] items-center gap-1 whitespace-nowrap px-2.5 text-[12px] font-semibold uppercase tracking-wide transition-colors xl:px-3 ${
                        isActive(item.href)
                          ? "text-accent"
                          : "text-body group-hover:text-ink"
                      }`}
                    >
                      {t(item.label)}
                      {item.children && (
                        <CaretDown
                          size={10}
                          weight="bold"
                          className="opacity-50"
                        />
                      )}
                    </Link>
                    {item.children && (
                      <ul className="invisible absolute left-0 top-full z-50 w-60 rounded-b-xl border border-t-0 border-line bg-surface py-2 opacity-0 shadow-sm transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={l(child.href)}
                              className="block px-4 py-2 text-[13px] font-medium text-body transition-colors hover:text-accent"
                            >
                              {t(child.label)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}

                {/* Lainnya: mega-menu berkelompok */}
                <li className="group relative">
                  <button
                    type="button"
                    className="flex h-[72px] items-center gap-1 whitespace-nowrap px-2.5 text-[12px] font-semibold uppercase tracking-wide text-body transition-colors group-hover:text-ink xl:px-3"
                  >
                    {t("Lainnya")}
                    <CaretDown size={10} weight="bold" className="opacity-50" />
                  </button>
                  <div className="invisible absolute right-0 top-full z-50 grid w-[600px] grid-cols-3 gap-6 rounded-b-xl border border-t-0 border-line bg-surface p-6 opacity-0 shadow-md transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    {lainnyaGroups.map((groep) => (
                      <div key={groep.label}>
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-meta">
                          {t(groep.label)}
                        </p>
                        <ul className="space-y-0.5">
                          {groep.items.map((it) => {
                            const ItemIcon = iconFor(it.href);
                            return (
                              <li key={it.href}>
                                <Link
                                  href={l(it.href)}
                                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-body transition-colors hover:bg-canvas hover:text-accent"
                                >
                                  <ItemIcon
                                    size={16}
                                    weight="regular"
                                    className="shrink-0 text-meta"
                                  />
                                  {t(it.label)}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </li>
              </ul>
            </nav>

            <div className="flex items-center gap-2">
              <SearchTrigger />
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? t("Tutup menu") : t("Buka menu")}
                aria-expanded={mobileOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-body xl:hidden"
              >
                {mobileOpen ? (
                  <X size={18} weight="regular" />
                ) : (
                  <List size={18} weight="regular" />
                )}
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Menu mobile: overlay layar penuh berkelompok */}
      {mobileOpen && (
        <nav
          aria-label="Menu utama (mobile)"
          className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto overscroll-contain border-t border-line bg-canvas xl:hidden"
        >
          <div className="mx-auto max-w-xl px-5 pb-16 pt-6">
            {/* Kop identitas: tanpa ini panel langsung membuka ke daftar
                rubrik tanpa framing brand sama sekali. */}
            <p className="mb-7 border-b border-line pb-5 text-[11px] font-medium uppercase leading-[1.6] tracking-[0.16em] text-meta">
              {t(site.tagline)}
            </p>

            {/* Rubrik utama */}
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-meta">
              {t("Utama")}
            </p>
            <ul className="mb-8 divide-y divide-line/70">
              {mainMenu.map((item) => {
                const MainIcon = iconFor(item.href);
                return (
                  <li key={item.label}>
                    {item.children ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenSub(openSub === item.label ? null : item.label)
                          }
                          aria-expanded={openSub === item.label}
                          className="flex w-full items-center gap-3 py-4 text-[15px] font-semibold uppercase tracking-wide text-ink"
                        >
                          <MainIcon
                            size={18}
                            weight="regular"
                            className="shrink-0 text-meta"
                          />
                          <span className="flex-1 text-left">
                            {t(item.label)}
                          </span>
                          <CaretDown
                            size={15}
                            weight="regular"
                            className={`text-meta transition-transform ${
                              openSub === item.label ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {openSub === item.label && (
                          <ul className="mb-2 ml-1 space-y-0.5 border-l border-line pl-4">
                            <li>
                              <Link
                                href={l(item.href)}
                                onClick={closeMobile}
                                className="block py-2.5 text-[15px] font-medium text-accent"
                              >
                                {t("Semua")} {t(item.label)}
                              </Link>
                            </li>
                            {item.children.map((child) => (
                              <li key={child.href}>
                                <Link
                                  href={l(child.href)}
                                  onClick={closeMobile}
                                  className="block py-2.5 text-[15px] text-body transition-colors hover:text-accent"
                                >
                                  {t(child.label)}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link
                        href={l(item.href)}
                        onClick={closeMobile}
                        className="flex items-center gap-3 py-4 text-[15px] font-semibold uppercase tracking-wide text-ink transition-colors hover:text-accent"
                      >
                        <MainIcon
                          size={18}
                          weight="regular"
                          className="shrink-0 text-meta"
                        />
                        {t(item.label)}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Rubrik lainnya, ditampilkan per kelompok (tidak disembunyikan) */}
            {lainnyaGroups.map((groep) => (
              <div key={groep.label} className="mb-8">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-meta">
                  {t(groep.label)}
                </p>
                <ul className="divide-y divide-line/70">
                  {groep.items.map((it) => {
                    const ItemIcon = iconFor(it.href);
                    return (
                      <li key={it.href}>
                        <Link
                          href={l(it.href)}
                          onClick={closeMobile}
                          className="flex items-center gap-3 py-4 text-[15px] font-semibold uppercase tracking-wide text-ink transition-colors hover:text-accent"
                        >
                          <ItemIcon
                            size={18}
                            weight="regular"
                            className="shrink-0 text-meta"
                          />
                          {t(it.label)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            {/* Tentang */}
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-meta">
              {t("Tentang")}
            </p>
            <ul className="divide-y divide-line/70">
              {tentangMobile.map((item) => (
                <li key={item.href}>
                  <Link
                    href={l(item.href)}
                    onClick={closeMobile}
                    className="block py-3.5 text-[15px] text-body transition-colors hover:text-accent"
                  >
                    {t(item.label)}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Bahasa */}
            <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-meta">
                {t("Bahasa")}
              </p>
              <LanguageToggle />
            </div>
          </div>
        </nav>
      )}
    </>
  );
}
