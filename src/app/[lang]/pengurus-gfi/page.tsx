import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/PageHeader";
import { CompassDivider } from "@/components/Ornaments";
import { pengurus, pengurusGfiCopy } from "@/data/pages/pengurus-gfi";
import { getLang } from "@/lib/i18n-server";
import { DEFAULT_LANG, isLocale } from "@/lib/locale-routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const copy = pengurusGfiCopy[isLocale(lang) ? lang : DEFAULT_LANG];
  return { title: copy.metaTitle, description: copy.metaDescription };
}

const [ketua, ...anggota] = pengurus;

export default async function PengurusGfiPage() {
  const lang = await getLang();
  const copy = pengurusGfiCopy[lang];
  return (
    <>
      <PageHeader title={copy.title} lead={copy.lead} />
      <div className="mx-auto max-w-7xl px-4 py-10 pb-20">
        <div className="mx-auto max-w-[75ch] space-y-5">
          <p className="text-base leading-relaxed">{copy.pengantar}</p>
        </div>

        <CompassDivider className="mt-10" />

        {/* Sorotan: Direktur Eksekutif */}
        <article className="mt-10 grid overflow-hidden rounded-2xl border border-line bg-surface md:grid-cols-[minmax(0,340px)_1fr]">
          <div className="relative aspect-[4/5] md:aspect-auto">
            <Image
              src={ketua.foto}
              alt={`${copy.potretAltPrefix} ${ketua.nama}`}
              fill
              sizes="(min-width: 768px) 340px, 100vw"
              className="object-cover object-top grayscale-[0.15]"
              priority
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-surface/10"
            />
          </div>
          <div className="p-6 md:p-9">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
              {copy.dewanLabel}
            </p>
            <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
              {ketua.nama}
            </h2>
            <p className="mt-1.5 text-sm font-semibold text-accent">
              {ketua.teks[lang].jabatan}
            </p>
            <p className="mt-4 text-[15px] leading-relaxed">
              {ketua.teks[lang].bio}
            </p>
          </div>
        </article>

        {/* Anggota lainnya */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {anggota.map((p) => (
            <article
              key={p.nama}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={p.foto}
                  alt={`${copy.potretAltPrefix} ${p.nama}`}
                  fill
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover object-top grayscale-[0.15] transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
                />
                <h2 className="absolute inset-x-0 bottom-0 p-4 font-display text-lg font-bold leading-tight text-white">
                  {p.nama}
                </h2>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-sm font-semibold text-accent">
                  {p.teks[lang].jabatan}
                </p>
                <p className="mt-2.5 text-sm leading-relaxed">
                  {p.teks[lang].bio}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
