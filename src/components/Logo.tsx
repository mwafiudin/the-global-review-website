"use client";

import Image from "@/components/ImageWithFallback";
import Link from "next/link";
import { site } from "@/data/site";
import { useLang } from "@/lib/i18n";

/**
 * Wordmark serif dari logotype asli (tgr-wordmark.svg, digenerate dari
 * path huruf tgr-logo.svg; kompas menjadi huruf O pada GLOBAL).
 * Varian emas dipakai di atas latar gelap.
 */
export function Logo({
  withTagline = false,
  onDark = false,
  homeHref = "/",
}: {
  withTagline?: boolean;
  /** Paksa wordmark emas + teks terang, untuk latar gelap (mis. footer navy). */
  onDark?: boolean;
  /** Beranda per bahasa ("/" atau "/en") — dipasok header/footer lewat l(). */
  homeHref?: string;
}) {
  const { t } = useLang();

  return (
    <Link
      href={homeHref}
      className="inline-flex shrink-0 items-center gap-3.5"
      aria-label="The Global Review, ke beranda"
    >
      {onDark ? (
        <Image
          src="/tgr-wordmark-dark.svg"
          alt="The Global Review"
          width={3072}
          height={350}
          className="h-6 w-auto md:h-7"
        />
      ) : (
        <>
          <Image
            src="/tgr-wordmark.svg"
            alt="The Global Review"
            width={3072}
            height={350}
            priority
            className="h-6 w-auto md:h-7 dark:hidden"
          />
          <Image
            src="/tgr-wordmark-dark.svg"
            alt="The Global Review"
            width={3072}
            height={350}
            priority
            className="hidden h-6 w-auto md:h-7 dark:block"
          />
        </>
      )}
      {withTagline && (
        // Sembunyi di mobile: bar hanya menyisakan 40px di samping wordmark,
        // dan menumpuknya ke bawah membuat header terasa penuh — perannya
        // diambil kop di panel menu burger. xl:hidden karena di 1280–1535px
        // nav utama muncul dan bar jadi sesak; 2xl melegakan lagi. Membungkus
        // sendiri (bukan <br> keras) supaya versi EN ikut memecah baris wajar.
        <span className="hidden max-w-[12rem] border-l border-line pl-3.5 text-[10px] font-medium uppercase leading-[1.4] tracking-[0.14em] text-meta md:block xl:hidden 2xl:block">
          {t(site.tagline)}
        </span>
      )}
    </Link>
  );
}
