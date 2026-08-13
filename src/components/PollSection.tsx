import Image from "next/image";
import { activePolls } from "@/lib/polls";
import { toPollView } from "@/lib/wp/polls";
import { SectionHeading } from "./SectionHeading";
import { PollCarousel } from "./PollCarousel";

/** Section jajak pendapat di homepage: grid (desktop) / carousel (mobile). */
export async function PollSection() {
  const views = await Promise.all(activePolls().map(toPollView));
  if (views.length === 0) return null;

  return (
    <section
      aria-label="Jajak Pendapat"
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
