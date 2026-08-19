import Image from "next/image";
import { toPollViews, wpActivePolls } from "@/lib/wp/polls";
import { getT } from "@/lib/i18n-server";
import { SectionHeading } from "./SectionHeading";
import { PollCarousel } from "./PollCarousel";

/** Section jajak pendapat di homepage: grid (desktop) / carousel (mobile). */
export async function PollSection() {
  // Tiga terbaru: grid desktop memang satu baris tiga kolom, dan arsip poll
  // WordPress akan terus bertambah.
  const views = await toPollViews((await wpActivePolls()).slice(0, 3));
  if (views.length === 0) return null;
  const { t } = await getT();

  return (
    <section
      aria-label={t("Jajak Pendapat")}
      className="relative overflow-hidden py-12 md:py-16"
    >
      {/* Watermark kompas di area heading */}
      <Image
        src="/tgr-gold-compass.svg"
        alt=""
        width={300}
        height={302}
        aria-hidden
        className="pointer-events-none absolute right-2 top-2 h-[150px] w-auto opacity-[0.07] md:right-10 md:h-[190px]"
      />
      <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
        <SectionHeading title="Jajak Pendapat" />
        <PollCarousel polls={views} />
      </div>
    </section>
  );
}
