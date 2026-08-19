"use client";

import { createContext, useContext, type ReactNode } from "react";
import { tFor } from "@/lib/dictionary/ui";
import { localizeHref, type Lang } from "@/lib/locale-routing";

export type { Lang };

/**
 * Bahasa aktif ditentukan URL (segmen [lang]) dan disuntik layout lewat
 * provider ini — bukan lagi localStorage. Dengan begitu render server dan
 * client selalu sepakat, tanpa kedip ganti bahasa pasca-hidrasi.
 */
const LangContext = createContext<Lang>("id");

export function LanguageProvider({
  lang = "id",
  children,
}: {
  lang?: Lang;
  children: ReactNode;
}) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

/** t: kamus berkunci string sumber Indonesia; l: prefiks href per bahasa. */
export function useLang() {
  const lang = useContext(LangContext);
  return {
    lang,
    t: tFor(lang),
    l: (href: string) => localizeHref(href, lang),
  };
}
