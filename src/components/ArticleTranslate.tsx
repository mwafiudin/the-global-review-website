"use client";

import { useEffect, useRef, useState } from "react";
import { Translate } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n";
import { chromeTranslatorProvider } from "@/lib/translate/chrome";
import type { TranslateSession } from "@/lib/translate/provider";

/**
 * Terjemah isi artikel on-device (Chrome Translator API, desktop). Hanya
 * tampil di halaman artikel /en saat API-nya tersedia; di luar itu render
 * null — pembaca tetap mendapat artikel bahasa Indonesia.
 *
 * Cara kerja: kumpulkan text node di bawah elemen [data-tgr-translate]
 * (judul, kutipan, badan), simpan aslinya, lalu tulis hasil terjemahan ke
 * nodeValue satu per satu. Markup inline (tautan, penanda sorotan .mk)
 * tidak tersentuh, dan React tidak melawan karena konten artikel statis —
 * tidak pernah di-render ulang. Provider-nya kontrak lepas: bila kelak
 * terjemahan tersimpan di WordPress, komponen ini tinggal tidak dirender.
 */

type Status =
  | "cek" // availability sedang diperiksa
  | "siap" // tombol tampil, belum diterjemahkan
  | "unduh" // model diunduh (progres 0..1)
  | "jalan" // menerjemahkan node demi node
  | "selesai" // hasil terjemahan sedang tampil
  | "asli" // pembaca kembali ke teks asli
  | "galat";

function kumpulkanTextNode(): Text[] {
  const hasil: Text[] = [];
  const akar = document.querySelectorAll("[data-tgr-translate]");
  for (const el of akar) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const teks = n as Text;
      if (teks.nodeValue && teks.nodeValue.trim().length > 0) hasil.push(teks);
    }
  }
  return hasil;
}

export function ArticleTranslate() {
  const { lang, t } = useLang();
  const [status, setStatus] = useState<Status>("cek");
  const [progres, setProgres] = useState(0);
  const asli = useRef(new Map<Text, string>());
  const hasil = useRef(new Map<Text, string>());
  const sesi = useRef<TranslateSession | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    if (lang !== "en") return;
    let hidup = true;
    // Batas waktu: pada sebagian lingkungan (embedded Chromium, komponen AI
    // belum terpasang) availability() menggantung tanpa pernah menjawab.
    Promise.race([
      chromeTranslatorProvider.availability("id", "en"),
      new Promise<"unavailable">((r) =>
        setTimeout(() => r("unavailable"), 5000)
      ),
    ]).then((a) => {
      if (hidup && a !== "unavailable") setStatus("siap");
    });
    return () => {
      hidup = false;
      ctrl.current?.abort();
      sesi.current?.destroy();
      sesi.current = null;
    };
  }, [lang]);

  if (lang !== "en" || status === "cek") return null;

  function pasang(peta: Map<Text, string>) {
    for (const [node, teks] of peta) node.nodeValue = teks;
  }

  async function terjemahkan() {
    // create() menuntut user activation — karena itu semua di handler klik.
    const controller = new AbortController();
    ctrl.current = controller;
    setStatus("unduh");
    setProgres(0);
    try {
      const session =
        sesi.current ??
        (await chromeTranslatorProvider.createSession({
          source: "id",
          target: "en",
          signal: controller.signal,
          onDownloadProgress: setProgres,
        }));
      sesi.current = session;
      setStatus("jalan");

      if (asli.current.size === 0) {
        for (const node of kumpulkanTextNode()) {
          asli.current.set(node, node.nodeValue ?? "");
        }
      }
      for (const [node, sumber] of asli.current) {
        if (controller.signal.aborted) return;
        let terjemahan = hasil.current.get(node);
        if (terjemahan === undefined) {
          terjemahan = await session.translate(sumber);
          hasil.current.set(node, terjemahan);
        }
        node.nodeValue = terjemahan;
      }
      setStatus("selesai");
    } catch {
      if (!controller.signal.aborted) {
        pasang(asli.current);
        setStatus("galat");
      }
    }
  }

  function klik() {
    if (status === "selesai") {
      pasang(asli.current);
      setStatus("asli");
    } else if (status === "asli") {
      pasang(hasil.current);
      setStatus("selesai");
    } else if (status === "siap" || status === "galat") {
      void terjemahkan();
    }
  }

  const label =
    status === "unduh"
      ? `${t("Mengunduh model")} ${Math.round(progres * 100)}%`
      : status === "jalan"
        ? t("Menerjemahkan…")
        : status === "selesai"
          ? t("Tampilkan asli")
          : status === "galat"
            ? t("Terjemahan gagal — coba lagi")
            : t("Terjemahkan artikel");

  const sibuk = status === "unduh" || status === "jalan";

  return (
    <div className="flex items-center gap-2">
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
