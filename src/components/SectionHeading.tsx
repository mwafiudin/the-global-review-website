import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getT } from "@/lib/i18n-server";

/**
 * Judul & tautan diterjemahkan di sini supaya seluruh pemanggil (semuanya
 * server component) tetap mengirim string Indonesia apa adanya.
 */
export async function SectionHeading({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  const { t, l } = await getT();
  return (
    <div className="mb-10 flex items-baseline justify-between gap-4 border-b border-line pb-4">
      <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-ink md:text-sm">
        {t(title)}
      </h2>
      {href && (
        <Link
          href={l(href)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-opacity hover:opacity-70"
        >
          {t("Lihat semua")}
          <ArrowRight size={12} weight="regular" />
        </Link>
      )}
    </div>
  );
}
