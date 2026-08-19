import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getT } from "@/lib/i18n-server";

/**
 * Band pengenal brand di tengah beranda: satu-satunya foto berwarna penuh
 * di halaman ini, sengaja diberi ruang sendiri sebagai jeda antar seksi
 * agar tidak berebut perhatian dengan headline.
 */
export async function BrandBand() {
  const { t, l } = await getT();
  return (
    <section
      aria-label={t("Tentang The Global Review")}
      className="border-y border-line bg-surface"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 md:py-20 lg:grid-cols-2 lg:gap-16 lg:px-6">
        <Image
          src="/images/the-global-review-brand-stationery.jpg"
          alt="Identitas The Global Review: jurnal navy berlogo emas, kompas kuningan, dan koran di atas meja kayu"
          width={1402}
          height={1122}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-[4/3] w-full rounded-xl object-cover shadow-sm"
        />

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            {t("Tentang Kami")}
          </p>
          <h2 className="mt-4 max-w-md font-display text-2xl font-extrabold leading-snug tracking-tight text-ink md:text-3xl">
            {t("Mengenal dunia, mengenal negeri kita sendiri.")}
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-body md:text-base">
            {t("The Global Review adalah kanal jurnalistik")}{" "}
            <span className="font-semibold text-ink">
              Global Future Institute
            </span>
            {t(", lembaga pengkajian geopolitik dan politik luar negeri yang berdiri pada 2007. Sejak 2008 kami menyebarluaskan pikiran para pengkaji masalah internasional — bukan mengejar kecepatan kabar, melainkan kejernihan membaca arah dunia.")}
          </p>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-body md:text-base">
            {t("Analisis, opini, dan kajian kawasan kami susun untuk pembaca yang ingin memahami mengapa sebuah peristiwa terjadi, bukan sekadar mengetahui bahwa ia terjadi.")}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href={l("/tentang-tgr")}
              className="group inline-flex items-center gap-2 rounded-lg bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-surface transition-colors hover:bg-accent active:scale-[0.98]"
            >
              {t("Tentang The Global Review")}
              <ArrowRight
                size={13}
                weight="bold"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href={l("/tentang-gfi")}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent transition-opacity hover:opacity-70"
            >
              {t("Tentang GFI")}
              <ArrowRight size={12} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
