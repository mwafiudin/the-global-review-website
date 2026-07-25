"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";

/** Garis bujur-lintang globe: motif "pemandu" selain kompas. */
function GlobeLines({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden
      className={className}
    >
      <circle cx="100" cy="100" r="97" stroke="currentColor" strokeWidth="1" />
      <ellipse
        cx="100"
        cy="100"
        rx="62"
        ry="97"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      <ellipse
        cx="100"
        cy="100"
        rx="26"
        ry="97"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      <line
        x1="3"
        y1="100"
        x2="197"
        y2="100"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      <path
        d="M15 54 Q100 34 185 54"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      <path
        d="M15 146 Q100 166 185 146"
        stroke="currentColor"
        strokeWidth="0.8"
      />
    </svg>
  );
}

export function NewsletterForm() {
  const [sent, setSent] = useState(false);
  const { t } = useLang();

  return (
    <section
      aria-label="Buletin"
      className="relative overflow-hidden bg-[#011840] dark:bg-[#18181b]"
    >
      <GlobeLines className="pointer-events-none absolute -right-20 -top-28 h-[360px] w-[360px] text-[#d9b14a] opacity-25" />
      <GlobeLines className="pointer-events-none absolute -bottom-32 -left-24 hidden h-[280px] w-[280px] text-white opacity-10 md:block" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-[1fr_auto] md:py-20 lg:px-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d9b14a]">
            {t("Buletin The Global Review")}
          </p>
          <p className="mt-3 max-w-xl font-display text-2xl font-extrabold leading-snug tracking-tight text-white md:text-3xl">
            {t("Independen dan mendalam, langsung ke email Anda.")}
          </p>
          <p className="mt-3 text-sm text-white/60">
            {t(
              "Analisis geopolitik pilihan redaksi. Tanpa spam, berhenti kapan saja."
            )}
          </p>
        </div>

        {sent ? (
          <p className="text-sm text-white/85">
            {t("Terima kasih, Anda sudah terdaftar.")}
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="flex w-full gap-3 md:w-[400px]"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Alamat email
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder={t("Alamat email Anda")}
              className="w-full rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-[#d9b14a] focus:outline-none focus:ring-2 focus:ring-[#d9b14a]/30"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#011840] transition-colors hover:bg-[#d9b14a] active:scale-[0.98] dark:text-[#18181b]"
            >
              {t("Berlangganan")}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
