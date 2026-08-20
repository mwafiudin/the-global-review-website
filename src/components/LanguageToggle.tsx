"use client";

import { usePathname } from "next/navigation";
import { Translate } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n";
import { LANGS, alternatePath, type Lang } from "@/lib/locale-routing";

/**
 * Pemindah bahasa ID/EN. Dipakai di utility bar (desktop) dan menu mobile.
 * Tautan dokumen penuh, bukan navigasi client-router, dengan sengaja:
 * (1) berganti pohon bahasa me-remount <html>, dan navigasi client menyapu
 *     kelas .dark yang dipasang theme-init.js di luar React — muat penuh
 *     menjalankan ulang skrip itu sehingga tema pembaca selamat;
 * (2) root layout tidak di-render ulang di klien (React memperingatkan
 *     <script> di head yang tak akan dieksekusi);
 * (3) crawler menemukan pohon /en dari tautan nyata di setiap halaman.
 * Query string (filter rubrik) dibawa lewat handler klik; href dibiarkan
 * bersih untuk crawler.
 */
export function LanguageToggle({ withIcon = false }: { withIcon?: boolean }) {
  const { lang } = useLang();
  const pathname = usePathname();

  function klik(e: React.MouseEvent<HTMLAnchorElement>, target: Lang) {
    if (target === lang) {
      e.preventDefault();
      return;
    }
    // Hormati buka-di-tab-baru; selain itu bawa query string saat ini.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    if (window.location.search) {
      e.preventDefault();
      window.location.assign(
        alternatePath(pathname, target) + window.location.search
      );
    }
  }

  return (
    // translate="no" di /en: pagar dari widget terjemah Google (lihat Search).
    <div
      translate={lang === "en" ? "no" : undefined}
      className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide"
    >
      {withIcon && (
        <Translate
          size={14}
          weight="regular"
          aria-hidden
          className="text-meta"
        />
      )}
      {LANGS.map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-line">/</span>}
          <a
            href={alternatePath(pathname, l)}
            hrefLang={l}
            onClick={(e) => klik(e, l)}
            aria-current={lang === l ? "true" : undefined}
            className={`transition-colors ${
              lang === l ? "text-accent" : "text-meta hover:text-ink"
            }`}
          >
            {l.toUpperCase()}
          </a>
        </span>
      ))}
    </div>
  );
}
