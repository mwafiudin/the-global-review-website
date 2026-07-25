"use client";

import { useState } from "react";
import {
  Check,
  LinkSimple,
  WhatsappLogo,
  XLogo,
} from "@phosphor-icons/react";

/** Tombol bagikan artikel: salin tautan, WhatsApp, X. URL dihitung saat klik (SSR-safe). */
export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard tidak tersedia
    }
  }

  function open(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const btn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-line text-body transition-colors hover:border-accent hover:text-accent";

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-meta">
        Bagikan
      </span>
      <button type="button" onClick={copy} aria-label="Salin tautan" className={btn}>
        {copied ? (
          <Check size={16} weight="bold" className="text-accent" />
        ) : (
          <LinkSimple size={16} />
        )}
      </button>
      <button
        type="button"
        aria-label="Bagikan ke WhatsApp"
        className={btn}
        onClick={() =>
          open(
            `https://wa.me/?text=${encodeURIComponent(title + " " + window.location.href)}`
          )
        }
      >
        <WhatsappLogo size={16} />
      </button>
      <button
        type="button"
        aria-label="Bagikan ke X"
        className={btn}
        onClick={() =>
          open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`
          )
        }
      >
        <XLogo size={16} />
      </button>
    </div>
  );
}
