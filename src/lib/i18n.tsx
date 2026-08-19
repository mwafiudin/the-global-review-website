"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { EN } from "@/lib/dictionary/ui";

export type Lang = "id" | "en";

// Store eksternal sederhana (SSR-safe, tanpa setState di effect).
let currentLang: Lang = "id";
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("tgr-lang");
    if (saved === "en" || saved === "id") currentLang = saved;
  } catch {}
}

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): Lang {
  return currentLang;
}

function getServerSnapshot(): Lang {
  return "id";
}

/** Ubah bahasa aktif, simpan, dan beri tahu seluruh pelanggan. */
export function setLang(next: Lang) {
  currentLang = next;
  try {
    localStorage.setItem("tgr-lang", next);
  } catch {}
  if (typeof document !== "undefined") document.documentElement.lang = next;
  listeners.forEach((cb) => cb());
}

/**
 * Provider masih passthrough; prop lang dari layout [lang] baru dipakai saat
 * peralihan ke konteks URL (store localStorage di bawah menyusul dihapus).
 */
export function LanguageProvider({
  children,
}: {
  lang?: Lang;
  children: ReactNode;
}) {
  return <>{children}</>;
}

export function useLang() {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const t = (s: string) => (lang === "en" ? EN[s] ?? s : s);
  return { lang, setLang, t };
}
