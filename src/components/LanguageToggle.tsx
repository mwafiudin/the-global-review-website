"use client";

import { Translate } from "@phosphor-icons/react";
import { useLang, type Lang } from "@/lib/i18n";

const langs: Lang[] = ["id", "en"];

/**
 * Pemindah bahasa ID/EN. Dipakai di utility bar (desktop) dan menu mobile.
 * `withIcon` menampilkan ikon globe di depan (untuk utility bar).
 */
export function LanguageToggle({ withIcon = false }: { withIcon?: boolean }) {
  const { lang, setLang } = useLang();

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
      {langs.map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-line">/</span>}
          <button
            type="button"
            onClick={() => setLang(l)}
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
