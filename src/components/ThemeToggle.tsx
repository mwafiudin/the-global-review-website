"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n";

export function ThemeToggle() {
  const { lang } = useLang();

  function toggle() {
    const root = document.documentElement;
    const isDark = root.classList.toggle("dark");
    try {
      localStorage.setItem("tgr-theme", isDark ? "dark" : "light");
    } catch {
      // localStorage tidak tersedia (mis. mode privat)
    }
  }

  return (
    // translate="no" di /en: pagar dari widget terjemah Google (lihat Search).
    <button
      type="button"
      onClick={toggle}
      translate={lang === "en" ? "no" : undefined}
      aria-label="Ganti mode terang/gelap"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-body transition-colors hover:border-accent hover:text-accent"
    >
      <Moon size={16} weight="bold" className="dark:hidden" />
      <Sun size={16} weight="bold" className="hidden dark:block" />
    </button>
  );
}
