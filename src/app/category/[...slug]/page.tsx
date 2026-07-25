import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categoryNames, mainMenu } from "@/data/site";
import { getAuthor } from "@/data/authors";
import { byCategory, categoryName } from "@/lib/articles";
import { categoryIcon } from "@/lib/categoryIcons";
import { CardRow } from "@/components/ArticleCard";
import { CategoryBrowser } from "@/components/CategoryBrowser";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";

export function generateStaticParams() {
  return Object.keys(categoryNames).map((slug) => ({
    slug: slug.split("/"),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const key = slug.join("/");
  if (!categoryNames[key]) return {};
  return {
    title: `Rubrik ${categoryNames[key]}`,
    description: `Kumpulan artikel The Global Review pada rubrik ${categoryNames[key]}.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const key = slug.join("/");
  if (!categoryNames[key]) notFound();

  const list = byCategory(key);
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

  // Breadcrumb: Beranda › [induk] › [rubrik ini]
  const breadcrumb = [
    { label: "Beranda", href: "/" },
    ...slug.map((_, i) => {
      const partKey = slug.slice(0, i + 1).join("/");
      const isLast = i === slug.length - 1;
      return {
        label: categoryName(partKey),
        href: isLast ? undefined : `/category/${partKey}`,
      };
    }),
  ];

  return (
    <>
      <PageHeader
        title={categoryName(key)}
        icon={categoryIcon(key)}
        breadcrumb={breadcrumb}
        meta={`${list.length} artikel`}
      />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          <section aria-label={`Artikel ${categoryName(key)}`}>
            {list.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line px-6 py-16 text-center">
                <p className="font-display text-lg font-bold text-ink">
                  Belum ada artikel di rubrik ini
                </p>
                <p className="mt-2 text-sm text-meta">
                  Artikel untuk rubrik {categoryName(key)} akan tampil di sini
                  setelah dipublikasikan.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-block rounded-lg border border-ink bg-surface px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-surface"
                >
                  Kembali ke Beranda
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
          </section>
          <Sidebar />
        </div>
      </div>
    </>
  );
}
