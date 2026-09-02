"use client";

import { useState } from "react";
import {
  Check,
  FacebookLogo,
  InstagramLogo,
  TelegramLogo,
  XLogo,
} from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n";

/**
 * Tombol bagikan artikel: Facebook, Telegram, X, Instagram. URL dihitung
 * saat klik (SSR-safe).
 *
 * Instagram tidak punya share-intent web — tidak ada padanan sharer.php di
 * sana. Satu-satunya jalur sah adalah share sheet perangkat, jadi tombolnya
 * memanggil navigator.share() bila didukung (praktisnya: mobile, tempat
 * aplikasi Instagram-nya ada) dan di desktop menyalin tautan agar bisa
 * ditempel manual. Ikon dipertahankan supaya barisnya tetap terbaca sebagai
 * empat kanal yang diminta redaksi.
 */
export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const { lang, t } = useLang();

  function open(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function shareToInstagram() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // dibatalkan pengguna atau ditolak — lanjut ke salin tautan
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard tidak tersedia
    }
  }

  const btn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-line text-body transition-colors hover:border-accent hover:text-accent";

  return (
    // translate="no" di /en: pagar dari widget terjemah Google (lihat Search).
    <div
      translate={lang === "en" ? "no" : undefined}
      className="flex items-center gap-2"
    >
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-meta">
        {t("Bagikan")}
      </span>
      <button
        type="button"
        aria-label={t("Bagikan ke Facebook")}
        className={btn}
        onClick={() =>
          open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`
          )
        }
      >
        <FacebookLogo size={16} />
      </button>
      <button
        type="button"
        aria-label={t("Bagikan ke Telegram")}
        className={btn}
        onClick={() =>
          open(
            `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(title)}`
          )
        }
      >
        <TelegramLogo size={16} />
      </button>
      <button
        type="button"
        aria-label={t("Bagikan ke X")}
        className={btn}
        onClick={() =>
          open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`
          )
        }
      >
        <XLogo size={16} />
      </button>
      <button
        type="button"
        aria-label={t("Bagikan ke Instagram")}
        title={t("Instagram tidak menerima tautan langsung — tautan disalin agar bisa ditempel")}
        className={btn}
        onClick={shareToInstagram}
      >
        {copied ? (
          <Check size={16} weight="bold" className="text-accent" />
        ) : (
          <InstagramLogo size={16} />
        )}
      </button>
    </div>
  );
}
