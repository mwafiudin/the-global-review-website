import Image from "next/image";
import Link from "next/link";

/**
 * Wordmark serif dari logotype asli (tgr-wordmark.svg, digenerate dari
 * path huruf tgr-logo.svg; kompas menjadi huruf O pada GLOBAL).
 * Varian emas dipakai di atas latar gelap.
 */
export function Logo({
  withTagline = false,
  onDark = false,
}: {
  withTagline?: boolean;
  /** Paksa wordmark emas + teks terang, untuk latar gelap (mis. footer navy). */
  onDark?: boolean;
}) {
  return (
    <Link
      href="/"
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
        <span className="hidden whitespace-nowrap border-l border-line pl-3.5 text-[10px] font-medium uppercase tracking-[0.14em] text-meta lg:block xl:hidden 2xl:block">
          Pemandu Informasi
          <br />
          Perkembangan Dunia
        </span>
      )}
    </Link>
  );
}
