import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categoryNames, mainMenu } from "@/data/site";
import { getT } from "@/lib/i18n-server";
import { getAuthor } from "@/data/authors";
import { categoryName } from "@/lib/articles";
import { byCategoryWithTotal } from "@/lib/wp/articles";
import { wpCategoryIds } from "@/lib/wp/rubrik";
import { categoryIcon } from "@/lib/categoryIcons";
import { parseHalaman } from "@/lib/pagination";
import { CardRow } from "@/components/ArticleCard";
import { CategoryBrowser } from "@/components/CategoryBrowser";
import { PageHeader } from "@/components/PageHeader";
import { PaginationNav } from "@/components/PaginationNav";
import { Sidebar } from "@/components/Sidebar";

/** Satu lembar arsip = batas lama daftar rubrik (100 terbaru). */
const PER_HALAMAN = 100;

/**
 * Kosong: halaman rubrik dirender on-demand + ISR (build tidak memberondong
 * WordPress). Gerbang notFound di bawah tetap menjaga slug liar → 404.
 */
export function generateStaticParams(): { slug: string[] }[] {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { rubrik, page } = parseHalaman(slug);
  const key = rubrik.join("/");
  // Streaming (loading.tsx): status 404 diputuskan sebelum shell terkirim.
  if (!(await rubrikAda(key))) notFound();
  const nama = categoryName(key);
  return {
    title: page > 1 ? `Rubrik ${nama} — Halaman ${page}` : `Rubrik ${nama}`,
    description: `Kumpulan artikel The Global Review pada rubrik ${nama}.`,
  };
}

/**
 * Rubrik sah bila terdaftar di menu situs, ATAU merupakan kategori yang
 * benar-benar ada di WordPress — kategori baru buatan redaksi tetap punya
 * halaman sambil menunggu didaftarkan. Slug karangan tetap 404.
 */
async function rubrikAda(key: string): Promise<boolean> {
  if (categoryNames[key]) return true;
  return (await wpCategoryIds(key)).length > 0;
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  // /halaman/1 tidak sampai ke sini — redirects() di next.config.ts sudah
  // meng-308-kannya ke URL dasar rubrik.
  const { rubrik, page } = parseHalaman(slug);
  const key = rubrik.join("/");
  if (!(await rubrikAda(key))) notFound();

  // list dibatasi 100 per lembar (payload ke browser); total = jumlah
  // sebenarnya. Nomor halaman di luar rentang membuat WP menjawab 400 —
  // diterjemahkan jadi 404, bukan halaman error.
  let list, total;
  try {
    ({ list, total } = await byCategoryWithTotal(key, PER_HALAMAN, page));
  } catch (e) {
    if (page > 1) notFound();
    throw e;
  }
  const totalPages = Math.max(1, Math.ceil(total / PER_HALAMAN));
  if (page > totalPages) notFound();
  const { t, l } = await getT();
  const menuEntry = mainMenu.find(
    (item) => item.href === `/category/${key}`
  );

  // Sub-rubrik (untuk filter in-place) dari children menu
  const subcategories = (menuEntry?.children ?? []).map((child) => ({
    label: child.label,
    key: child.href.replace("/category/", ""),
  }));

  // Penulis yang muncul di rubrik ini
  const authorSlugs = Array.from(new Set(list.map((a) => a.author)));
  const authors = authorSlugs
    .map((s) => ({ slug: s, name: getAuthor(s).name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Breadcrumb: Beranda › [induk] › [rubrik ini] — tanpa ekor /halaman/{n}
  const breadcrumb = [
    { label: t("Beranda"), href: l("/") },
    ...rubrik.map((_, i) => {
      const partKey = rubrik.slice(0, i + 1).join("/");
      const isLast = i === rubrik.length - 1;
      return {
        label: t(categoryName(partKey)),
        href: isLast ? undefined : l(`/category/${partKey}`),
      };
    }),
  ];

  return (
    <>
      <PageHeader
        title={t(categoryName(key))}
        icon={categoryIcon(key)}
        breadcrumb={breadcrumb}
        meta={
          totalPages > 1
            ? `${total} ${t("artikel")} · ${t("halaman")} ${page} ${t("dari")} ${totalPages}`
            : `${total} ${t("artikel")}`
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          <section aria-label={`${t("Artikel")} ${t(categoryName(key))}`}>
            {list.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line px-6 py-16 text-center">
                <p className="font-display text-lg font-bold text-ink">
                  {t("Belum ada artikel di rubrik ini")}
                </p>
                <p className="mt-2 text-sm text-meta">
                  <span>{t("Artikel untuk rubrik")}</span> <span>{t(categoryName(key))}</span>{" "}
                  <span>{t("akan tampil di sini setelah dipublikasikan.")}</span>
                </p>
                <Link
                  href={l("/")}
                  className="mt-5 inline-block rounded-lg border border-ink bg-surface px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-surface"
                >
                  {t("Kembali ke Beranda")}
                </Link>
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="divide-y divide-line">
                    {list.slice(0, 8).map((a) => (
                      <CardRow key={a.slug} article={a} />
                    ))}
                  </div>
                }
              >
                <CategoryBrowser
                  articles={list}
                  subcategories={subcategories}
                  authors={authors}
                  categoryLabel={categoryName(key)}
                />
              </Suspense>
            )}
            <PaginationNav
              rubrikKey={key}
              current={page}
              totalPages={totalPages}
            />
          </section>
          <Sidebar />
        </div>
      </div>
    </>
  );
}
