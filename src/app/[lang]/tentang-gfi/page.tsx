import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { CompassDivider, CompassPoint } from "@/components/Ornaments";
import { tentangGfiCopy } from "@/data/pages/tentang-gfi";
import { getLang } from "@/lib/i18n-server";
import { DEFAULT_LANG, isLocale } from "@/lib/locale-routing";
import { dwibahasa } from "@/lib/seo";
import { wpTentangGfi } from "@/lib/wp/halaman";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const copy = tentangGfiCopy[isLocale(lang) ? lang : DEFAULT_LANG];
  const bahasa = isLocale(lang) ? lang : DEFAULT_LANG;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    // Tersedia penuh di dua bahasa: pasangan hreflang timbal balik.
    alternates: dwibahasa(bahasa, "/tentang-gfi"),
  };
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-14 font-display text-xl font-extrabold tracking-tight text-ink">
      {children}
    </h2>
  );
}

export default async function TentangGfiPage() {
  const copy = await wpTentangGfi(await getLang());
  const [pembukaAwal, ...pembukaSisa] = copy.pembuka;
  return (
    <>
      <PageHeader title={copy.title} lead={copy.lead} />
      <div className="mx-auto max-w-7xl px-4 py-10 pb-20">
        <div className="mx-auto max-w-[75ch] space-y-5">
          <p className="drop-cap text-base leading-relaxed">{pembukaAwal}</p>
          {pembukaSisa.map((p) => (
            <p key={p.slice(0, 40)} className="text-base leading-relaxed">
              {p}
            </p>
          ))}

          <SubHeading>{copy.isuHeading}</SubHeading>
          <p className="text-base leading-relaxed">{copy.isuIntro}</p>
          <ul className="space-y-2.5">
            {copy.isuPokok.map((isu) => (
              <li key={isu} className="flex gap-3 text-base leading-relaxed">
                <CompassPoint />
                {isu}
              </li>
            ))}
          </ul>

          <figure className="py-6">
            <CompassDivider />
            <blockquote className="mx-auto mt-8 max-w-xl text-center text-2xl italic leading-snug text-ink md:text-[28px]">
              {copy.visiQuote}
            </blockquote>
            <figcaption className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-meta">
              {copy.visiCaption}
            </figcaption>
            <CompassDivider className="mt-8" />
          </figure>

          <SubHeading>{copy.misiHeading}</SubHeading>
          <ul className="space-y-3">
            {copy.misi.map((m) => (
              <li key={m} className="flex gap-3 text-base leading-relaxed">
                <CompassPoint />
                {m}
              </li>
            ))}
          </ul>

          <SubHeading>{copy.fokusHeading}</SubHeading>
          <p className="text-base leading-relaxed">{copy.fokusIntro}</p>
          <ul className="space-y-2.5">
            {copy.fokusKegiatan.map((f) => (
              <li key={f} className="flex gap-3 text-base leading-relaxed">
                <CompassPoint />
                {f}
              </li>
            ))}
          </ul>
          <p className="text-base leading-relaxed">{copy.fokusPenutup}</p>
        </div>
      </div>
    </>
  );
}
