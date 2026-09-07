import Image from "@/components/ImageWithFallback";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { bookImprint } from "@/data/books";
import { pustakaGfi } from "@/lib/wp/books";
import { getT } from "@/lib/i18n-server";

/**
 * Karya sendiri di beranda, tepat di bawah band Tentang Kami: setelah
 * pembaca tahu GFI itu lembaga pengkajian, buku-bukunya jadi bukti paling
 * padat dari klaim itu. Latar dasar (bukan `surface` seperti BrandBand)
 * supaya dua band yang berdampingan tidak melebur jadi satu blok panjang.
 *
 * Kosong → null. Band dengan rak buku kosong lebih buruk daripada tidak
 * ada band sama sekali, dan penandanya baru diisi redaksi di wp-admin.
 */
export async function PustakaBand() {
  const buku = await pustakaGfi();
  if (buku.length === 0) return null;

  const { t, l } = await getT();

  return (
    <section aria-label={t("Pustaka GFI")} className="border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-14 md:py-16 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
              {t("Pustaka GFI")}
            </p>
            <h2 className="mt-3 max-w-lg font-display text-2xl font-extrabold leading-snug tracking-tight text-ink md:text-3xl">
              {t("Karya para pengkaji kami.")}
            </h2>
          </div>
          <Link
            href={l("/pustaka-gfi")}
            className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent transition-opacity hover:opacity-70"
          >
            {t("Lihat semua")}
            <ArrowRight
              size={12}
              weight="bold"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* Menggulir mendatar di layar sempit: memaksa empat sampul turun
            jadi kolom membuat band ini setinggi satu layar penuh. */}
        <ul className="mt-9 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-4">
          {buku.slice(0, 4).map((b) => (
            <li
              key={b.slug}
              className="w-[46vw] shrink-0 snap-start sm:w-auto"
            >
              <Link href={l(`/bedah-buku/${b.slug}`)} className="group block">
                <Image
                  src={b.cover}
                  alt={`Sampul buku ${b.judul}`}
                  width={1088}
                  height={1452}
                  sizes="(min-width: 1024px) 260px, (min-width: 640px) 30vw, 46vw"
                  className="aspect-[3/4] w-full rounded-lg bg-canvas object-cover shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg"
                />
                <h3 className="mt-4 font-display text-[15px] font-bold leading-snug text-ink transition-colors group-hover:text-accent">
                  {b.judul}
                </h3>
                {b.penerbit && (
                  <p className="mt-1 text-xs text-meta">{bookImprint(b)}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
