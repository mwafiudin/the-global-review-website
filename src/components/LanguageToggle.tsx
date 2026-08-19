"use client";

import { usePathname, useRouter } from "next/navigation";
import { Translate } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n";
import { LANGS, alternatePath, type Lang } from "@/lib/locale-routing";

/**
 * Pemindah bahasa ID/EN. Dipakai di utility bar (desktop) dan menu mobile.
 * Berpindah lewat navigasi URL (/ ↔ /en/…), bukan state client — query
 * string (filter rubrik dsb.) ikut dibawa. `withIcon` menampilkan ikon
 * globe di depan (untuk utility bar).
 */
export function LanguageToggle({ withIcon = false }: { withIcon?: boolean }) {
  const { lang } = useLang();
  const router = useRouter();
  const pathname = usePathname();

  function pindah(target: Lang) {
    if (target === lang) return;
    // window.location.search, bukan useSearchParams: hook itu menuntut
    // Suspense boundary dari root layout ke semua halaman.
    router.push(alternatePath(pathname, target) + window.location.search);
  }

  return (
    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide">
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
          <button
            type="button"
            onClick={() => pindah(l)}
            aria-pressed={lang === l}
            className={`transition-colors ${
              lang === l ? "text-accent" : "text-meta hover:text-ink"
            }`}
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
