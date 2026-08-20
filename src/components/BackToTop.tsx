"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n";

/** Tombol kembali ke atas, muncul setelah menggulir jauh. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  const { lang, t } = useLang();

  useEffect(() => {
    let raf = 0;
    function update() {
      raf = 0;
      setShow(window.scrollY > 700);
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    // translate="no" di /en: pagar dari widget terjemah Google (lihat Search).
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      translate={lang === "en" ? "no" : undefined}
      aria-label={t("Kembali ke atas")}
      className={`fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-sm transition-all duration-300 hover:border-accent hover:text-accent ${
        show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ArrowUp size={18} weight="bold" />
    </button>
  );
}
