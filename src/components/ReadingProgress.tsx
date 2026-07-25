"use client";

import { useEffect, useRef } from "react";

/** Bar progres baca tipis di bawah header. Menulis langsung ke DOM (tanpa re-render). */
export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const barEl = barRef.current;
    if (!barEl) return;
    const bar: HTMLDivElement = barEl;
    let raf = 0;

    function update() {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? Math.min(1, doc.scrollTop / max) : 0;
      bar.style.transform = `scaleX(${p})`;
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-[72px] z-30 h-0.5 origin-left bg-line"
    >
      <div
        ref={barRef}
        className="h-full origin-left scale-x-0 bg-accent will-change-transform"
      />
    </div>
  );
}
