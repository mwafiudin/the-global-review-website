"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { ArrowRight, MagnifyingGlass, X } from "@phosphor-icons/react";
import { articles } from "@/data/articles";
import { mainMenu } from "@/data/site";
import {
  articleHref,
  categoryName,
  featuredArticles,
  formatDate,
} from "@/lib/articles";
import type { Article } from "@/lib/types";

const popularCategories = mainMenu.filter((m) => m.href !== "#");

const SearchContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
} | null>(null);

function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch harus di dalam <SearchProvider>");
  return ctx;
}

/** Tombol pemicu pencarian (dipakai di header). */
export function SearchTrigger() {
  const { setOpen } = useSearch();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Cari artikel"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-body transition-colors hover:border-accent hover:text-accent"
    >
      <MagnifyingGlass size={16} weight="bold" />
    </button>
  );
}

/**
 * Membungkus seluruh isi halaman. Saat pencarian terbuka, isi halaman
 * (header + konten + footer) di-blur seragam, dan panel pencarian
 * dirender di layer terpisah agar tetap tajam.
 */
export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // ⌘K / Ctrl+K buka-tutup, Esc tutup
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Kunci scroll body saat terbuka
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <SearchContext.Provider value={{ open, setOpen }}>
      <div
        inert={open}
        className={`transition duration-200 ${
          open ? "blur-[6px] saturate-[0.85]" : ""
        }`}
      >
        {children}
      </div>
      {open && <SearchPanel onClose={() => setOpen(false)} />}
    </SearchContext.Provider>
  );
}

function ResultRow({
  article,
  onClick,
}: {
  article: Article;
  onClick: () => void;
}) {
  return (
    <Link
      href={articleHref(article)}
      onClick={onClick}
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-meta">
          {categoryName(article.category)}
        </p>
        <p className="mt-1 truncate font-display text-[15px] font-semibold text-ink">
          {article.title}
        </p>
        <p className="mt-0.5 text-xs text-meta">{formatDate(article.date)}</p>
      </div>
      <ArrowRight
        size={15}
        weight="bold"
        className="shrink-0 text-meta opacity-0 transition-opacity group-hover:opacity-100"
      />
    </Link>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const featured = useMemo(() => featuredArticles(5), []);
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return articles
      .filter((a) =>
        `${a.title} ${a.excerpt} ${categoryName(a.category)}`
          .toLowerCase()
          .includes(term)
      )
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }, [q]);

  const empty = q.trim() === "";

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-center bg-ink/20 px-4 pt-[12vh] search-fade"
      onClick={onClose}
    >
      <div
        className="flex h-fit max-h-[76vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-ink/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <MagnifyingGlass size={18} className="shrink-0 text-meta" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder="Cari artikel, rubrik, topik…"
            className="w-full bg-transparent py-4 text-[15px] text-ink placeholder:text-meta focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pencarian"
            className="shrink-0 text-meta transition-colors hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {empty ? (
            <div className="py-3">
              <p className="px-4 pb-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-meta">
                Jelajahi rubrik
              </p>
              <div className="flex flex-wrap gap-2 px-4 pb-5">
                {popularCategories.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    onClick={onClose}
                    className="rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-body transition-colors hover:border-accent hover:text-accent"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
              <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-meta">
                Sorotan
              </p>
              <ul className="divide-y divide-line/70">
                {featured.map((a) => (
                  <li key={a.slug}>
                    <ResultRow article={a} onClick={onClose} />
                  </li>
                ))}
              </ul>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <MagnifyingGlass
                size={26}
                weight="thin"
                className="mx-auto text-meta"
              />
              <p className="mt-3 text-sm text-body">
                Tidak ada hasil untuk &ldquo;{q}&rdquo;.
              </p>
              <p className="mt-1 text-xs text-meta">
                Coba kata kunci lain atau jelajahi rubrik.
              </p>
            </div>
          ) : (
            <>
              <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-meta">
                {results.length} hasil
              </p>
              <ul className="divide-y divide-line/70">
                {results.map((a) => (
                  <li key={a.slug}>
                    <ResultRow article={a} onClick={onClose} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-[11px] text-meta">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-line px-1.5 py-0.5 font-sans text-[10px]">
              ↵
            </kbd>
            buka
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-line px-1.5 py-0.5 font-sans text-[10px]">
              Esc
            </kbd>
            tutup
          </span>
        </div>
      </div>
    </div>
  );
}
