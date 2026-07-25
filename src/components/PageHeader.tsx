import Image from "next/image";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

export interface Crumb {
  label: string;
  href?: string;
}

export function PageHeader({
  title,
  lead,
  icon: WatermarkIcon,
  breadcrumb,
  meta,
}: {
  title: string;
  lead?: string;
  /** Ikon watermark kontekstual per rubrik; default kompas brand. */
  icon?: Icon;
  /** Jejak navigasi; bila ada, menggantikan kicker "The Global Review". */
  breadcrumb?: Crumb[];
  /** Info kecil di bawah judul, mis. "12 artikel". */
  meta?: string;
}) {
  return (
    <div className="relative overflow-hidden border-b border-line">
      {/* Watermark kontekstual: ikon rubrik, atau kompas brand sebagai default */}
      {WatermarkIcon ? (
        <WatermarkIcon
          aria-hidden
          weight="thin"
          className="pointer-events-none absolute -right-14 top-1/2 h-[360px] w-[360px] -translate-y-1/2 text-brand opacity-[0.1] md:-right-6"
        />
      ) : (
        <Image
          src="/tgr-gold-compass.svg"
          alt=""
          width={420}
          height={423}
          aria-hidden
          className="pointer-events-none absolute -right-20 top-1/2 h-[380px] w-auto -translate-y-1/2 opacity-[0.07] md:-right-10"
        />
      )}
      <div className="relative mx-auto max-w-7xl px-4 py-14 md:py-20 lg:px-6">
        {breadcrumb ? (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-[0.14em] text-meta">
              {breadcrumb.map((c, i) => (
                <li key={i} className="flex items-center gap-2">
                  {i > 0 && <CaretRight size={10} weight="bold" aria-hidden />}
                  {c.href ? (
                    <Link
                      href={c.href}
                      className="transition-colors hover:text-accent"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-ink">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : (
          <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-meta">
            <Image
              src="/tgr-gold-compass.svg"
              alt=""
              width={16}
              height={16}
              aria-hidden
              className="h-4 w-4"
            />
            The Global Review
          </p>
        )}
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink md:text-5xl">
          {title}
        </h1>
        {meta && <p className="mt-3 text-sm font-medium text-meta">{meta}</p>}
        {lead && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-body md:text-lg">
            {lead}
          </p>
        )}
      </div>
    </div>
  );
}
