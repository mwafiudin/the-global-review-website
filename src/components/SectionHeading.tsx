import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export function SectionHeading({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-10 flex items-baseline justify-between gap-4 border-b border-line pb-4">
      <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-ink md:text-sm">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-opacity hover:opacity-70"
        >
          Lihat semua
          <ArrowRight size={12} weight="regular" />
        </Link>
      )}
    </div>
  );
}
