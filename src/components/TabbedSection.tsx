"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { Article } from "@/lib/types";
import { inCategory } from "@/lib/articles";
import { useLang } from "@/lib/i18n";
import { CardCompact, CardFeature } from "./ArticleCard";

interface Tab {
  label: string;
  slug: string | null; // null = semua
}

/**
 * Section dengan tab filter kategori.
 * layout "featured-list": 2 kartu utama + daftar ringkas.
 * layout "grid": deretan 4 kartu fitur.
 */
export function TabbedSection({
  title,
  href,
  tabs,
  articles,
  layout = "featured-list",
}: {
  title: string;
  href: string;
  tabs: Tab[];
  articles: Article[];
  layout?: "featured-list" | "grid";
}) {
  const [active, setActive] = useState<string | null>(null);
  const { lang, t, l } = useLang();

  const filtered =
    active === null
      ? articles
      : articles.filter((a) => inCategory(a, active));

  const featured = filtered.slice(0, 2);
  const rest = filtered.slice(2, 6);
  const gridItems = filtered.slice(0, 4);

  return (
    // translate="no" di /en: pagar dari widget terjemah Google (lihat Search).
    <section aria-label={t(title)} translate={lang === "en" ? "no" : undefined}>
      <div className="mb-10 flex flex-col gap-3 border-b border-line sm:flex-row sm:items-baseline sm:justify-between sm:gap-x-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-ink sm:pb-4 md:text-sm">
          {t(title)}
        </h2>
        <div className="-mb-px flex items-baseline gap-5 overflow-x-auto pb-0 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const isActive = active === tab.slug;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActive(tab.slug)}
                aria-pressed={isActive}
                className={`shrink-0 whitespace-nowrap border-b-2 pb-4 text-xs font-semibold transition-colors ${
                  isActive
                    ? "border-accent text-ink"
                    : "border-transparent text-meta hover:text-ink"
                }`}
              >
                {t(tab.label)}
              </button>
            );
          })}
          <Link
            href={l(href)}
            className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap pb-4 text-xs font-semibold text-accent transition-opacity hover:opacity-70 sm:inline-flex"
          >
            {t("Lihat semua")}
            <ArrowRight size={12} weight="regular" />
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-meta">
          {t("Belum ada artikel pada rubrik ini.")}
        </p>
      ) : layout === "grid" ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {gridItems.map((a) => (
            <CardFeature key={a.slug} article={a} withExcerpt={false} />
          ))}
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-2">
            {featured.map((a) => (
              <CardFeature key={a.slug} article={a} />
            ))}
          </div>
          <div className="flex flex-col gap-6 border-line lg:border-l lg:pl-10">
            {rest.map((a) => (
              <CardCompact key={a.slug} article={a} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
