"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Translate } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n";
import {
  ELEMENT_DIV_ID,
  ELEMENT_SCRIPT_ID,
  ELEMENT_SCRIPT_SRC,
  ELEMENT_STYLE,
  ELEMENT_STYLE_ID,
  bahasaGoogtrans,
  penghapusGoogtrans,
} from "@/lib/translate/element";

/**
 * Terjemah isi artikel via widget Google Translate (element.js) — mekanisme
 * yang sama dengan plugin GTranslate gratis, berjalan di semua browser tanpa
 * unduh model. Hanya tampil di halaman artikel /en.
 *
 * Cara kerja: klik → suntik skrip element.js + div tersembunyi + CSS
 * penetral, lalu pilih "en" pada combo tersembunyi milik Google; Google yang
 * menulis-ulang teks halaman di browser pembaca. Selesai terdeteksi dari
 * kelas translated-* yang dipasang Google pada <html>. Komponen interaktif
 * dilindungi atribut translate="no" (lihat komentar di masing-masing
 * komponen) supaya React tidak me-reconcile node yang sudah dibungkus
 * Google. "Tampilkan asli" menghapus cookie googtrans lalu memuat ulang —
 * jalur pulih yang paling andal untuk widget ini.
 */

type Status =
  | "siap" // tombol tampil, belum diterjemahkan
  | "jalan" // skrip dimuat / Google sedang menerjemahkan
  | "selesai" // terjemahan sedang tampil
  | "galat";

const TENGGAT_MS = 15000;

function htmlSudahDiterjemahkan(): boolean {
  const kelas = document.documentElement.classList;
  return kelas.contains("translated-ltr") || kelas.contains("translated-rtl");
}

export function ArticleTranslate() {
  const { lang, t } = useLang();
  const [status, setStatus] = useState<Status>("siap");
  const pengamat = useRef<MutationObserver | null>(null);
  const tenggat = useRef<number | null>(null);
  const pollCombo = useRef<number | null>(null);

  const hentikanPemantauan = useCallback(() => {
    pengamat.current?.disconnect();
    pengamat.current = null;
    if (tenggat.current !== null) window.clearTimeout(tenggat.current);
    if (pollCombo.current !== null) window.clearInterval(pollCombo.current);
    tenggat.current = null;
    pollCombo.current = null;
  }, []);

  const jalankan = useCallback(() => {
    setStatus("jalan");

    // Infrastruktur widget — idempoten, aman dipanggil ulang saat retry.
    if (!document.getElementById(ELEMENT_STYLE_ID)) {
      const gaya = document.createElement("style");
      gaya.id = ELEMENT_STYLE_ID;
      gaya.textContent = ELEMENT_STYLE;
      document.head.appendChild(gaya);
    }
    if (!document.getElementById(ELEMENT_DIV_ID)) {
      const wadah = document.createElement("div");
      wadah.id = ELEMENT_DIV_ID;
      document.body.appendChild(wadah);
    }
    window.tgrGoogleElementInit = () => {
      const Elemen = window.google?.translate?.TranslateElement;
      if (Elemen)
        new Elemen(
          { pageLanguage: "id", includedLanguages: "en", autoDisplay: false },
          ELEMENT_DIV_ID
        );
    };
    const skripLama = document.getElementById(ELEMENT_SCRIPT_ID);
    if (!skripLama) {
      const skrip = document.createElement("script");
      skrip.id = ELEMENT_SCRIPT_ID;
      skrip.src = ELEMENT_SCRIPT_SRC;
      skrip.onerror = () => {
        hentikanPemantauan();
        setStatus("galat");
      };
      document.body.appendChild(skrip);
    } else if (!document.querySelector("select.goog-te-combo")) {
      // Retry setelah galat: skrip sudah ada tapi widget belum terbentuk.
      window.tgrGoogleElementInit();
    }

    if (htmlSudahDiterjemahkan()) {
      setStatus("selesai");
      return;
    }

    // Dorong combo tersembunyi Google ke "en" begitu tersedia — persis cara
    // GTranslate memicunya (change dua kali; sekali kadang tak menggigit).
    pollCombo.current = window.setInterval(() => {
      const combo = document.querySelector<HTMLSelectElement>(
        "select.goog-te-combo"
      );
      if (!combo) return;
      if (pollCombo.current !== null) window.clearInterval(pollCombo.current);
      pollCombo.current = null;
      if (combo.value !== "en") {
        combo.value = "en";
        combo.dispatchEvent(new Event("change"));
        combo.dispatchEvent(new Event("change"));
      }
    }, 300);

    pengamat.current = new MutationObserver(() => {
      if (!htmlSudahDiterjemahkan()) return;
      hentikanPemantauan();
      setStatus("selesai");
    });
    pengamat.current.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    tenggat.current = window.setTimeout(() => {
      hentikanPemantauan();
      setStatus(htmlSudahDiterjemahkan() ? "selesai" : "galat");
    }, TENGGAT_MS);
  }, [hentikanPemantauan]);

  useEffect(() => {
    if (lang !== "en") return;
    // Kelanjutan antarhalaman: cookie googtrans aktif berarti pembaca sudah
    // memilih terjemahan — widget dimuat ulang tanpa menunggu klik. Ditunda
    // satu tick supaya render commit dulu (aturan set-state-in-effect).
    let tunda: number | null = null;
    if (bahasaGoogtrans(document.cookie) === "en") {
      tunda = window.setTimeout(jalankan, 0);
    }
    return () => {
      if (tunda !== null) window.clearTimeout(tunda);
      hentikanPemantauan();
    };
  }, [lang, jalankan, hentikanPemantauan]);

  if (lang !== "en") return null;

  function klik() {
    if (status === "selesai") {
      for (const resep of penghapusGoogtrans(window.location.hostname)) {
        document.cookie = resep;
      }
      window.location.reload();
    } else if (status === "siap" || status === "galat") {
      jalankan();
    }
  }

  const label =
    status === "jalan"
      ? t("Menerjemahkan…")
      : status === "selesai"
        ? t("Tampilkan asli")
        : status === "galat"
          ? t("Terjemahan gagal — coba lagi")
          : t("Terjemahkan artikel");

  const sibuk = status === "jalan";

  return (
    <div className="flex items-center gap-2" translate="no">
      <span
        aria-live="polite"
        className="text-[11px] font-bold uppercase tracking-[0.14em] text-meta"
      >
        {label}
      </span>
      <button
        type="button"
        onClick={klik}
        disabled={sibuk}
        aria-label={label}
        aria-pressed={status === "selesai"}
        className={`flex h-9 w-9 items-center justify-center rounded-full border border-line text-body transition-colors hover:border-accent hover:text-accent ${
          sibuk ? "animate-pulse motion-reduce:animate-none" : ""
        } ${status === "selesai" ? "border-accent text-accent" : ""}`}
      >
        <Translate size={16} />
      </button>
    </div>
  );
}
