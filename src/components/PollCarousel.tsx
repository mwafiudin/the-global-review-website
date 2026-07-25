"use client";

import { useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { PollView } from "@/lib/polls";
import { PollCard } from "./PollCard";

/**
 * Jajak pendapat: grid 3 kolom di desktop (lg+), carousel swipe di layar kecil.
 */
export function PollCarousel({ polls }: { polls: PollView[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const [index, setIndex] = useState(0);
  const count = polls.length;

  function onScroll() {
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const el = trackRef.current;
      if (!el) return;
      setIndex(Math.round(el.scrollLeft / el.clientWidth));
    });
  }

  function go(i: number) {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(count - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  }

  return (
    <>
      {/* Desktop: semua poll dalam grid */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-3">
        {polls.map((pv) => (
          <PollCard
            key={pv.poll.id}
            poll={pv.poll}
            sourceHref={pv.sourceHref}
            sourceTitle={pv.sourceTitle}
            sourceCategory={pv.sourceCategory}
            closed={pv.closed}
          />
        ))}
      </div>

      {/* Mobile/tablet: carousel */}
      <div className="relative lg:hidden">
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label="Poll sebelumnya"
              className="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-canvas text-body shadow-sm transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-0 sm:flex"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              disabled={index === count - 1}
              aria-label="Poll berikutnya"
              className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-canvas text-body shadow-sm transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-0 sm:flex"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </>
        )}

        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {polls.map((pv) => (
            <div key={pv.poll.id} className="w-full shrink-0 snap-center px-0.5">
              <div className="mx-auto max-w-2xl">
                <PollCard
                  poll={pv.poll}
                  sourceHref={pv.sourceHref}
                  sourceTitle={pv.sourceTitle}
                  sourceCategory={pv.sourceCategory}
                  closed={pv.closed}
                />
              </div>
            </div>
          ))}
        </div>

        {count > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {polls.map((pv, i) => (
              <button
                key={pv.poll.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ke poll ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-accent" : "w-2 bg-line hover:bg-meta"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
