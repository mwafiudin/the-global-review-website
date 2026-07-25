"use client";

import { useEffect, useRef } from "react";
import { worldDots } from "@/data/worldDots";

/**
 * Pembatas ambient: kontinen titik-titik (peta dunia) sangat samar.
 * - Monokrom: navy di light mode, terang di dark mode; tanpa warna aksen.
 * - Titik "bernapas" pelan; dekat kursor sedikit tersingkap (opasitas naik tipis), tanpa ganti warna.
 * - Hormati prefers-reduced-motion (jadi statis) & pause saat di luar viewport.
 */
export function WorldDotMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;
    const canvas: HTMLCanvasElement = cv;
    const ctx: CanvasRenderingContext2D = g;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Warna adaptif tema
    let base = [1, 34, 88]; // navy
    function readTheme() {
      const dark = document.documentElement.classList.contains("dark");
      base = dark ? [226, 226, 224] : [1, 34, 88];
    }
    readTheme();
    const themeObserver = new MutationObserver(readTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    let w = 0;
    let h = 0;
    let dpr = 1;
    // Peta 2:1 di-cover ke dalam kanvas
    let mapW = 0;
    let mapH = 0;
    let offX = 0;
    let offY = 0;

    function layout() {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // contain: peta utuh (rasio 360:138) memusat, dominan selebar container
      const ar = 360 / 138;
      if (w / h > ar) {
        mapH = h;
        mapW = h * ar;
      } else {
        mapW = w;
        mapH = w / ar;
      }
      offX = (w - mapW) / 2;
      offY = (h - mapH) / 2;
    }
    layout();

    const pointer = { x: -9999, y: -9999, active: false };
    const R = 130; // radius pengaruh kursor (px)

    function draw(t: number) {
      ctx.clearRect(0, 0, w, h);
      const baseR = Math.max(0.6, mapW / 1150); // radius titik dasar (kecil)
      const cr = base[0] | 0;
      const cg = base[1] | 0;
      const cb = base[2] | 0;
      for (let i = 0; i < worldDots.length; i++) {
        const d = worldDots[i];
        const px = offX + d[0] * mapW;
        const py = offY + d[1] * mapH;

        // napas halus (fase per-titik dari posisi)
        const breathe = reduce
          ? 0
          : 0.5 + 0.5 * Math.sin(t * 0.0011 + (d[0] + d[1]) * 9);

        const r = baseR * (0.85 + breathe * 0.25);
        let a = 0.17 + breathe * 0.06; // samar tapi terbaca (~17-23%)

        if (pointer.active) {
          const dx = px - pointer.x;
          const dy = py - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < R) {
            const k = 1 - dist / R; // 0..1
            a += k * 0.09; // tersingkap halus, tanpa ganti warna/ukuran
          }
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${a})`;
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    let raf = 0;
    let running = false;
    function loop(t: number) {
      draw(t);
      if (running) raf = requestAnimationFrame(loop);
    }
    function start() {
      if (running) return;
      running = true;
      if (reduce) draw(0);
      else raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    // Pause saat di luar viewport
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? start() : stop()),
      { threshold: 0 }
    );
    io.observe(canvas);

    function onMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
      if (reduce) draw(0); // statis: gambar ulang sekali saat gerak
    }
    function onLeave() {
      pointer.active = false;
      if (reduce) draw(0);
    }
    const ro = new ResizeObserver(() => {
      layout();
      if (reduce) draw(0);
    });
    ro.observe(canvas);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden h-full w-full md:block [mask-image:radial-gradient(100%_115%_at_50%_50%,#000_45%,transparent_100%)] [-webkit-mask-image:radial-gradient(100%_115%_at_50%_50%,#000_45%,transparent_100%)]"
    />
  );
}
