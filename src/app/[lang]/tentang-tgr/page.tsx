import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/PageHeader";
import { EndMark } from "@/components/Ornaments";
import { Sidebar } from "@/components/Sidebar";
import { tentangTgrCopy } from "@/data/pages/tentang-tgr";
import { getLang } from "@/lib/i18n-server";
import { DEFAULT_LANG, isLocale } from "@/lib/locale-routing";
import { dwibahasa } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const copy = tentangTgrCopy[isLocale(lang) ? lang : DEFAULT_LANG];
  const bahasa = isLocale(lang) ? lang : DEFAULT_LANG;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    // Tersedia penuh di dua bahasa: pasangan hreflang timbal balik.
    alternates: dwibahasa(bahasa, "/tentang-tgr"),
  };
}

export default async function TentangTgrPage() {
  const copy = tentangTgrCopy[await getLang()];
  return (
    <>
      <PageHeader title={copy.title} lead={copy.lead} />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          <div>
            <Image
              src="/images/the-global-review-brand-stationery.jpg"
              alt="Identitas brand The Global Review: jurnal navy, kompas kuningan, dan koran"
              width={1402}
              height={1122}
              priority
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="mb-8 aspect-[4/3] w-full rounded-xl object-cover"
            />
            <div className="space-y-5">
              {copy.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className={`max-w-[70ch] text-base leading-relaxed ${i === 0 ? "drop-cap" : ""}`}
                >
                  {p}
                </p>
              ))}
            </div>
            <EndMark className="pt-4" />
          </div>
          <Sidebar />
        </div>
      </div>
    </>
  );
}
