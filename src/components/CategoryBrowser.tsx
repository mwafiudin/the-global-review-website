"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { Article } from "@/lib/types";
import { inCategory, readingMinutes } from "@/lib/articles";
import { useLang } from "@/lib/i18n";
import { alternatePath } from "@/lib/locale-routing";
import { CardRow } from "./ArticleCard";

const PAGE_SIZE = 8;

type Sort = "newest" | "oldest" | "reading";
type Range = "all" | "month" | "year";

interface SubCat {
  label: string;
  key: string;
}

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export function CategoryBrowser({
  articles,
  subcategories,
  authors,
  categoryLabel,
  rubrikKey,
}: {
  articles: Article[];
  subcategories: SubCat[];
  authors: { slug: string; name: string }[];
  categoryLabel: string;
  /** Jalur rubrik FE (mis. "internasional") untuk kueri /api/rubrik. */
  rubrikKey: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const topRef = useRef<HTMLDivElement>(null);
  const { lang, t } = useLang();

  // URL sebagai sumber kebenaran
  const subLeaf = params.get("sub");
  const sub =
    subLeaf != null
      ? (subcategories.find((s) => s.key.split("/").pop() === subLeaf)?.key ??
        null)
      : null;
  const author = params.get("penulis");
  const range: Range =
    params.get("waktu") === "bulan"
      ? "month"
      : params.get("waktu") === "tahun"
        ? "year"
        : "all";
  const sort: Sort =
    params.get("urut") === "lama"
      ? "oldest"
      : params.get("urut") === "baca"
        ? "reading"
        : "newest";
  const page = Math.max(1, Number(params.get("page")) || 1);

  // usePathname bisa memunculkan bentuk internal /id/* (rewrite proxy);
  // normalkan ke URL kanonis bahasa aktif supaya replace/push tidak
  // memantul lewat redirect 308.
  const jalur = alternatePath(pathname, lang);

  function commit(
    mutate: (p: URLSearchParams) => void,
    opts: { resetPage?: boolean; scroll?: boolean; push?: boolean } = {}
  ) {
    const { resetPage = true, scroll = false, push = false } = opts;
    const p = new URLSearchParams(params.toString());
    mutate(p);
    if (resetPage) p.delete("page");
    const qs = p.toString();
    const url = qs ? `${jalur}?${qs}` : jalur;
    // Filter → replace (riwayat tak penuh); navigasi halaman → push (Back berfungsi)
    if (push) router.push(url, { scroll: false });
    else router.replace(url, { scroll: false });
    if (scroll)
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const setSub = (leaf: string | null) =>
    commit((p) => (leaf ? p.set("sub", leaf) : p.delete("sub")));
  const setAuthor = (slug: string | null) =>
    commit((p) => (slug ? p.set("penulis", slug) : p.delete("penulis")));
  const setRange = (v: Range) =>
    commit((p) =>
      v === "all"
        ? p.delete("waktu")
        : p.set("waktu", v === "month" ? "bulan" : "tahun")
    );
  const setSort = (v: Sort) =>
    commit((p) =>
      v === "newest"
        ? p.delete("urut")
        : p.set("urut", v === "oldest" ? "lama" : "baca")
    );
  const goTo = (pg: number) =>
    commit((p) => (pg <= 1 ? p.delete("page") : p.set("page", String(pg))), {
      resetPage: false,
      scroll: true,
      push: true,
    });
  const reset = () => router.replace(jalur, { scroll: false });

  /**
   * Filter/urut yang butuh cakupan SELURUH rubrik dijalankan server lewat
   * /api/rubrik — daftar yang diterima komponen ini hanya satu lembar 100
   * artikel terbaru, dan menyaring lembar itu pernah dijual sebagai filter
   * se-rubrik ("Terlama" = tertua dari 100 terbaru; penulis lama = "tidak
   * ada hasil"). Satu-satunya yang murni lokal adalah urutan "waktu baca"
   * tanpa filter lain: WordPress tidak bisa mengurutkannya.
   */
  const serverMode = Boolean(sub || author || range !== "all" || sort === "oldest");
  const lembar = Math.floor(((page - 1) * PAGE_SIZE) / 100) + 1;
  const qsRubrik = serverMode
    ? new URLSearchParams({
        rubrik: rubrikKey,
        ...(sub ? { sub } : {}),
        ...(author ? { penulis: author } : {}),
        ...(range !== "all"
          ? { waktu: range === "month" ? "bulan" : "tahun" }
          : {}),
        ...(sort === "oldest" ? { urut: "lama" } : {}),
        ...(lembar > 1 ? { lembar: String(lembar) } : {}),
      }).toString()
    : "";

  const [remote, setRemote] = useState<{
    qs: string;
    list: Article[];
    total: number;
  } | null>(null);

  useEffect(() => {
    if (!qsRubrik) return;
    let batal = false;
    fetch(`/api/rubrik?${qsRubrik}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!batal && d && Array.isArray(d.list)) {
          setRemote({ qs: qsRubrik, list: d.list, total: d.total ?? d.list.length });
        }
      })
      .catch(() => {
        // WP tak terjangkau: tampilan sementara (filter lembar lokal) tetap.
      });
    return () => {
      batal = true;
    };
  }, [qsRubrik]);

  // Tampilan SEMENTARA selagi /api/rubrik berjalan (dan cadangan bila
  // gagal): filter yang sama diterapkan pada lembar lokal.
  const localFiltered = useMemo(() => {
    let out = articles;
    if (sub) out = out.filter((a) => inCategory(a, sub));
    if (author) out = out.filter((a) => a.author === author);
    if (range !== "all") {
      // Bulan/tahun menurut jam Jakarta — new Date() polos membuat render
      // server (UTC) dan hidrasi klien berbeda daftar di sekitar pergantian
      // bulan/tahun.
      const [thn, bln] = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
      })
        .format(new Date())
        .split("-")
        .map(Number);
      out = out.filter((a) => {
        const [y, m] = a.date.split("-").map(Number);
        return range === "year" ? y === thn : y === thn && m === bln;
      });
    }
    const sorted = [...out];
    if (sort === "oldest") sorted.sort((a, b) => a.date.localeCompare(b.date));
    else if (sort === "reading")
      sorted.sort((a, b) => readingMinutes(a) - readingMinutes(b));
    else sorted.sort((a, b) => b.date.localeCompare(a.date));
    return sorted;
  }, [articles, sub, author, range, sort]);

  const aktif = serverMode && remote && remote.qs === qsRubrik ? remote : null;
  const filtered = useMemo(() => {
    if (!aktif) return localFiltered;
    // "Waktu baca" dikombinasikan dengan filter lain: urutkan di dalam
    // lembar hasil server (100 artikel) — WP tidak mengenal metrik ini.
    if (sort !== "reading") return aktif.list;
    return [...aktif.list].sort((a, b) => readingMinutes(a) - readingMinutes(b));
  }, [aktif, localFiltered, sort]);

  const totalCount = aktif ? aktif.total : filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  // Mode server: `filtered` adalah lembar 100 ke-{lembar}; offset halaman
  // dihitung di dalam lembar itu.
  const awalHalaman = aktif
    ? ((current - 1) * PAGE_SIZE) % 100
    : (current - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(awalHalaman, awalHalaman + PAGE_SIZE);
  const hasFilter = Boolean(sub || author) || range !== "all";

  const selectClass =
    "rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none";

  return (
    // translate="no" di /en: pagar dari widget terjemah Google (lihat Search).
    <div ref={topRef} translate={lang === "en" ? "no" : undefined}>
      {/* Filter sub-rubrik in-place */}
      {subcategories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSub(null)}
            aria-pressed={sub === null}
            className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              sub === null
                ? "border-ink bg-ink text-surface"
                : "border-line text-body hover:border-ink hover:text-ink"
            }`}
          >
            {t("Semua")}
          </button>
          {subcategories.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSub(s.key.split("/").pop() ?? null)}
              aria-pressed={sub === s.key}
              className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                sub === s.key
                  ? "border-ink bg-ink text-surface"
                  : "border-line text-body hover:border-ink hover:text-ink"
              }`}
            >
              {t(s.label)}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar: hitungan + filter penulis/waktu + urutkan */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <p className="text-sm text-meta">
          <span className="font-semibold text-ink">{totalCount}</span>{" "}
          <span>{t("artikel")}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {authors.length > 1 && (
            <select
              aria-label={t("Filter penulis")}
              value={author ?? ""}
              onChange={(e) => setAuthor(e.target.value || null)}
              className={selectClass}
            >
              <option value="">{t("Semua penulis")}</option>
              {authors.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label={t("Filter waktu")}
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
            className={selectClass}
          >
            <option value="all">{t("Semua waktu")}</option>
            <option value="month">{t("Bulan ini")}</option>
            <option value="year">{t("Tahun ini")}</option>
          </select>
          <select
            aria-label={t("Urutkan")}
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className={selectClass}
          >
            <option value="newest">{t("Terbaru")}</option>
            <option value="oldest">{t("Terlama")}</option>
            <option value="reading">{t("Waktu baca tercepat")}</option>
          </select>
        </div>
      </div>

      {/* Daftar */}
      {totalCount === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-6 py-16 text-center">
          <p className="font-display text-lg font-bold text-ink">
            {t("Tidak ada artikel yang cocok")}
          </p>
          <p className="mt-2 text-sm text-meta">
            <span>{t("Coba longgarkan filter untuk rubrik")}</span>{" "}
            <span>{t(categoryLabel)}</span>.
          </p>
          {hasFilter && (
            <button
              type="button"
              onClick={reset}
              className="mt-5 inline-block rounded-lg border border-ink bg-surface px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-surface"
            >
              {t("Reset filter")}
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-line">
          {pageItems.map((a) => (
            <CardRow key={a.slug} article={a} />
          ))}
        </div>
      )}

      {/* Pagination bernomor */}
      {totalPages > 1 && (
        <nav
          aria-label={t("Navigasi halaman")}
          className="mt-10 flex items-center justify-center gap-1.5"
        >
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            disabled={current === 1}
            aria-label={t("Halaman sebelumnya")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-body transition-colors hover:border-ink hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          {pageList(current, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="px-1.5 text-sm text-meta">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => goTo(p)}
                aria-current={p === current ? "page" : undefined}
                className={`h-9 min-w-9 rounded-lg border px-2 text-sm font-semibold transition-colors ${
                  p === current
                    ? "border-ink bg-ink text-surface"
                    : "border-line text-body hover:border-ink hover:text-ink"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            disabled={current === totalPages}
            aria-label={t("Halaman berikutnya")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-body transition-colors hover:border-ink hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          >
            <CaretRight size={14} weight="bold" />
          </button>
        </nav>
      )}
    </div>
  );
}
