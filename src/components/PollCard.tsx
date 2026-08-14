"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowClockwise,
  ArrowRight,
  ChartBar,
  WhatsappLogo,
  XLogo,
} from "@phosphor-icons/react";
import type { Poll, PollOption } from "@/data/polls";
import { pollTotal } from "@/lib/polls";

// Store kecil untuk suara di localStorage (SSR-safe, tanpa hydration mismatch).
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function readVote(pollId: string): string | null {
  try {
    return localStorage.getItem("tgr-poll-" + pollId);
  } catch {
    return null;
  }
}
function writeVote(pollId: string, optionId: string) {
  try {
    localStorage.setItem("tgr-poll-" + pollId, optionId);
  } catch {}
  listeners.forEach((l) => l());
}
function clearVote(pollId: string) {
  try {
    localStorage.removeItem("tgr-poll-" + pollId);
  } catch {}
  listeners.forEach((l) => l());
}
function useVote(pollId: string) {
  return useSyncExternalStore(
    subscribe,
    () => readVote(pollId),
    () => null
  );
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Angka menghitung naik (count-up) dari 0 ke value; hormati reduced-motion. */
function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = value.toLocaleString("id-ID");
      return;
    }
    let raf = 0;
    let startTs = 0;
    const dur = 700;
    function tick(t: number) {
      if (!startTs) startTs = t;
      const p = Math.min(1, (t - startTs) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el!.textContent = Math.round(value * eased).toLocaleString("id-ID");
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span ref={ref}>{value.toLocaleString("id-ID")}</span>;
}

/** Coretan tinta tak rata menimpa teks; animate = digambar kiri→kanan. */
function StrikeLine({ animate = false }: { animate?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 12"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 top-1/2 h-3 w-full -translate-y-1/2 text-accent"
    >
      <path
        d="M1.5 7 C 12 4.5, 22 9.5, 33 6.5 S 55 9, 66 6 S 88 8.5, 98.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        pathLength={100}
        className={animate ? "strike-anim" : undefined}
      />
    </svg>
  );
}

/** Cap pos arsip: status + tanggal berakhir, tinta pudar dan miring. */
function PostalMark({
  closed,
  date,
  compact,
}: {
  closed: boolean;
  date?: string;
  compact: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`absolute opacity-90 mix-blend-multiply dark:mix-blend-normal ${
        compact ? "right-3 top-3 h-16 w-16" : "right-4 top-4 h-[78px] w-[78px]"
      } ${
        closed
          ? "-rotate-12 text-[#9c4a3f] dark:text-[#c96b5f]"
          : "-rotate-6 text-accent"
      }`}
    >
      <svg viewBox="0 0 96 96" className="h-full w-full">
        <circle
          cx="48"
          cy="48"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <circle
          cx="48"
          cy="48"
          r="36"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.7"
        />
        <text
          x="48"
          y="31"
          textAnchor="middle"
          fontFamily="var(--font-montserrat), sans-serif"
          fontWeight="700"
          fontSize="7"
          letterSpacing="2"
          fill="currentColor"
          opacity="0.85"
        >
          ✦ TGR ✦
        </text>
        <line
          x1="27"
          y1="38.5"
          x2="69"
          y2="38.5"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.8"
        />
        <text
          x="48"
          y="52.5"
          textAnchor="middle"
          fontFamily="var(--font-montserrat), sans-serif"
          fontWeight="800"
          fontSize={closed ? "12" : "13"}
          letterSpacing="1.2"
          fill="currentColor"
        >
          {closed ? "DITUTUP" : "AKTIF"}
        </text>
        <line
          x1="27"
          y1="59.5"
          x2="69"
          y2="59.5"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.8"
        />
        <text
          x="48"
          y="71"
          textAnchor="middle"
          fontFamily="var(--font-montserrat), sans-serif"
          fontWeight="600"
          fontSize="7.4"
          letterSpacing="0.4"
          fill="currentColor"
          opacity="0.9"
        >
          {date ?? "✦ ✦ ✦"}
        </text>
      </svg>
    </div>
  );
}

export function PollCard({
  poll,
  sourceHref,
  sourceTitle,
  sourceCategory = "Jajak Pendapat",
  closed = false,
  compact = false,
}: {
  poll: Poll;
  sourceHref: string;
  sourceTitle: string;
  sourceCategory?: string;
  closed?: boolean;
  compact?: boolean;
}) {
  const voted = useVote(poll.id);
  const [striking, setStriking] = useState<string | null>(null);
  /** Rekap terbaru dari server, dipakai begitu suara pembaca tercatat. */
  const [hasil, setHasil] = useState<Record<string, number> | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const showResults = Boolean(voted) || closed;
  /** Suara pembaca: rekap terbaru bila ada, selain itu angka dari server. */
  const suara = (opt: PollOption) =>
    hasil ? (hasil[opt.id] ?? 0) : (opt.suara ?? 0);
  const total = hasil
    ? poll.options.reduce((n, o) => n + o.base + suara(o), 0)
    : pollTotal(poll);

  /** Kirim suara ke server; kegagalan tidak mengubah tampilan. */
  async function kirimSuara(optionId: string) {
    if (!poll.wpId) return;
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poll: poll.wpId, opsi: optionId }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { hasil?: Record<string, number> };
      if (data.hasil) setHasil(data.hasil);
    } catch {
      // Suara gagal terkirim — pilihannya tetap tercatat di peramban ini.
    }
  }

  /** Coret pilihan: gambar tinta + getar kartu, lalu catat suara. */
  function choose(optionId: string) {
    if (striking) return;
    void kirimSuara(optionId);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      writeVote(poll.id, optionId);
      return;
    }
    setStriking(optionId);
    timer.current = window.setTimeout(() => {
      writeVote(poll.id, optionId);
      setStriking(null);
    }, 700);
  }

  function share(target: "wa" | "x") {
    const url =
      typeof window !== "undefined"
        ? window.location.origin + sourceHref
        : sourceHref;
    const text = `Ikut jajak pendapat: ${poll.question}`;
    const href =
      target === "wa"
        ? `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={`ballot-wrap ${compact ? "" : "ballot-tilt"}`}>
      <section
        aria-label="Jajak pendapat"
        className={`ballot relative flex flex-col rounded-[3px] ${
          compact ? "p-5 pb-8" : "p-6 pb-9 md:p-7 md:pb-10"
        } ${closed ? "ballot--closed" : ""} ${striking ? "ballot--thud" : ""}`}
      >
        <PostalMark
          closed={closed}
          date={poll.closesAt ? fmtDate(poll.closesAt) : undefined}
          compact={compact}
        />

        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
          <ChartBar size={14} weight="bold" />
          {sourceCategory}
        </p>

        <h3
          className={`mt-3 font-serif font-bold leading-snug tracking-tight text-ink ${
            compact ? "pr-14 text-base" : "pr-16 text-lg md:pr-20 md:text-xl"
          }`}
        >
          {poll.question}
        </h3>

        <div className={compact ? "mt-4 space-y-2" : "mt-5 space-y-2.5"}>
          {poll.options.map((opt) => {
            const count = opt.base + suara(opt);
            const pct = total ? Math.round((count / total) * 100) : 0;
            const chosen = voted === opt.id;

            if (!showResults) {
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={Boolean(striking)}
                  onClick={() => choose(opt.id)}
                  className={`flex w-full items-center gap-3 rounded-[3px] border px-4 py-3 text-left text-sm transition-colors ${
                    striking === opt.id
                      ? "border-accent text-ink"
                      : "border-ink/20 text-body hover:border-accent hover:bg-surface/60 hover:text-ink"
                  }`}
                >
                  <span
                    className={`h-4 w-4 shrink-0 rounded-[2px] border-2 ${
                      striking === opt.id ? "border-accent" : "border-ink/30"
                    }`}
                  />
                  <span className="relative min-w-0">
                    {opt.label}
                    {striking === opt.id && <StrikeLine animate />}
                  </span>
                </button>
              );
            }
            return (
              <div key={opt.id} className="relative">
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span
                    className={`relative min-w-0 ${
                      chosen ? "font-semibold text-ink" : "text-body"
                    }`}
                  >
                    {opt.label}
                    {chosen && <StrikeLine />}
                  </span>
                  <span
                    className={`shrink-0 font-semibold ${chosen ? "text-accent" : "text-meta"}`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="h-[9px] overflow-hidden rounded-[2px] bg-ink/[0.07] dark:bg-white/10">
                  <div
                    className={`poll-bar h-full ${
                      chosen ? "bg-accent" : "hatch text-ink/60 dark:text-white/55"
                    }`}
                    style={
                      {
                        "--poll-w": `${pct}%`,
                        width: `${pct}%`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 border-t border-dashed border-ink/20 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-meta">
              Dipilih{" "}
              <span className="font-semibold text-ink">
                <CountUp value={total} />
              </span>{" "}
              pembaca
            </p>
            <div className="flex items-center gap-2">
              {voted && !closed && (
                <button
                  type="button"
                  onClick={() => clearVote(poll.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent transition-opacity hover:opacity-70"
                >
                  <ArrowClockwise size={13} weight="bold" />
                  Ubah pilihan
                </button>
              )}
              <button
                type="button"
                onClick={() => share("wa")}
                aria-label="Bagikan poll ke WhatsApp"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/20 text-body transition-colors hover:border-accent hover:text-accent"
              >
                <WhatsappLogo size={15} />
              </button>
              <button
                type="button"
                onClick={() => share("x")}
                aria-label="Bagikan poll ke X"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/20 text-body transition-colors hover:border-accent hover:text-accent"
              >
                <XLogo size={15} />
              </button>
            </div>
          </div>

          {!compact && sourceTitle && (
            <div className="mt-3">
              <Link
                href={sourceHref}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-opacity hover:opacity-70"
              >
                Baca artikel sumber
                <ArrowRight size={12} weight="bold" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
