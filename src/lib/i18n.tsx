"use client";

import { useSyncExternalStore, type ReactNode } from "react";

export type Lang = "id" | "en";

/**
 * Kamus antarmuka (UI). Cakupan: navigasi, footer, dan CTA buletin.
 * Konten artikel tetap bahasa Indonesia (tahap frontend).
 */
const EN: Record<string, string> = {
  // Rubrik utama
  Analisis: "Analysis",
  Internasional: "International",
  Geopolitik: "Geopolitics",
  "Politik-Keamanan": "Politics & Security",
  "Ekonomi & Bisnis": "Economy & Business",
  // Isu
  Diplomasi: "Diplomacy",
  Hukum: "Law",
  Sosial: "Society",
  Budaya: "Culture",
  "Lingkungan Hidup": "Environment",
  "Sains & Teknologi": "Science & Tech",
  Kesehatan: "Health",
  // Liputan khusus
  "Sorot Tokoh": "Profiles",
  Features: "Features",
  Media: "Media",
  // Kanal
  "Bedah Buku": "Book Reviews",
  Podcast: "Podcast",
  Galeri: "Gallery",
  // Kawasan
  "Asia Tenggara": "Southeast Asia",
  "Asia Timur": "East Asia",
  "Asia Selatan": "South Asia",
  "Asia Tengah": "Central Asia",
  Australia: "Australia",
  "Timur Tengah": "Middle East",
  Afrika: "Africa",
  "Amerika Latin": "Latin America",
  // Tentang / utility
  "Tentang Kami": "About Us",
  Redaksi: "Editorial",
  "Hubungi Kami": "Contact",
  "Tentang Global Future Institute": "About Global Future Institute",
  "Pengurus GFI": "GFI Board",
  // Header: grup & seksi
  Lainnya: "More",
  Utama: "Main",
  Isu: "Issues",
  "Liputan Khusus": "Special Coverage",
  Kanal: "Channels",
  Tentang: "About",
  Lembaga: "Institution",
  Semua: "All",
  Bahasa: "Language",
  // Header: aria
  "Cari artikel": "Search articles",
  "Ganti mode terang/gelap": "Toggle light/dark mode",
  "Buka menu": "Open menu",
  "Tutup menu": "Close menu",
  // Footer
  "Diterbitkan oleh": "Published by",
  "Lembaga pengkajian geopolitik dan politik luar negeri, berdiri 11 Oktober 2007.":
    "A geopolitics and foreign-policy think tank, established 11 October 2007.",
  "adalah kanal jurnalistiknya.": "is its journalistic channel.",
  "Tentang GFI": "About GFI",
  // Motto
  "Pemandu Informasi Perkembangan Dunia": "Your Guide to World Affairs",
  // CTA buletin
  "Buletin The Global Review": "The Global Review Newsletter",
  "Independen dan mendalam, langsung ke email Anda.":
    "Independent and in-depth, straight to your inbox.",
  "Analisis geopolitik pilihan redaksi. Tanpa spam, berhenti kapan saja.":
    "Curated geopolitical analysis. No spam, unsubscribe anytime.",
  "Alamat email Anda": "Your email address",
  Berlangganan: "Subscribe",
  "Terima kasih, Anda sudah terdaftar.": "Thank you, you're subscribed.",
};

// Store eksternal sederhana (SSR-safe, tanpa setState di effect).
let currentLang: Lang = "id";
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("tgr-lang");
    if (saved === "en" || saved === "id") currentLang = saved;
  } catch {}
}

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): Lang {
  return currentLang;
}

function getServerSnapshot(): Lang {
  return "id";
}

/** Ubah bahasa aktif, simpan, dan beri tahu seluruh pelanggan. */
export function setLang(next: Lang) {
  currentLang = next;
  try {
    localStorage.setItem("tgr-lang", next);
  } catch {}
  if (typeof document !== "undefined") document.documentElement.lang = next;
  listeners.forEach((cb) => cb());
}

/** Provider dipertahankan sebagai passthrough agar penataan layout tetap. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useLang() {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const t = (s: string) => (lang === "en" ? EN[s] ?? s : s);
  return { lang, setLang, t };
}
