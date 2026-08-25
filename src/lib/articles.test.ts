import { afterEach, describe, expect, it, vi } from "vitest";
import type { Article } from "./types";
import {
  articleImage,
  categoryName,
  formatDate,
  placeholderImage,
  splitHighlight,
} from "./articles";

describe("categoryName", () => {
  it("memakai label resmi untuk rubrik yang terdaftar", () => {
    expect(categoryName("ekonomi-bisnis")).toBe("Ekonomi & Bisnis");
    expect(categoryName("internasional/asia-tenggara")).toBe("Asia Tenggara");
  });

  it("merapikan slug rubrik yang belum terdaftar", () => {
    // Kategori baru dari wp-admin: lebih baik tampil sebagai teks yang layak
    // baca daripada slug mentah "kripto-aset".
    expect(categoryName("kripto-aset")).toBe("Kripto Aset");
    expect(categoryName("internasional/asia-timur-jauh")).toBe(
      "Asia Timur Jauh"
    );
    expect(categoryName("pendidikan")).toBe("Pendidikan");
  });
});

describe("splitHighlight", () => {
  it("memecah judul pada kemunculan pertama frasa", () => {
    expect(splitHighlight("Mengapa Geopolitik Penting?", "Geopolitik")).toEqual({
      before: "Mengapa ",
      match: "Geopolitik",
      after: " Penting?",
    });
  });

  it("frasa yang muncul dua kali tidak memotong ekor judul", () => {
    // String.split membuang potongan ketiga — regresi yang dijaga tes ini.
    expect(splitHighlight("Perang dan Perang Dagang", "Perang")).toEqual({
      before: "",
      match: "Perang",
      after: " dan Perang Dagang",
    });
  });

  it("null bila frasa kosong atau tak ditemukan", () => {
    expect(splitHighlight("Judul biasa", undefined)).toBeNull();
    expect(splitHighlight("Judul biasa", "")).toBeNull();
    expect(splitHighlight("Judul biasa", "geopolitik")).toBeNull();
  });

  it("frasa di ujung judul menghasilkan sisi kosong", () => {
    expect(splitHighlight("Poros Maritim", "Poros Maritim")).toEqual({
      before: "",
      match: "Poros Maritim",
      after: "",
    });
  });

  it("beda kapitalisasi tetap cocok (selaras stripos gerbang PHP)", () => {
    // Sunting Cepat bisa mengubah kapital judul tanpa menyentuh meta
    // sorotan; PHP menganggapnya masih sah, frontend tidak boleh berbeda.
    expect(splitHighlight("Politik Luar Negeri Bebas", "politik luar negeri")).toEqual({
      before: "",
      match: "Politik Luar Negeri",
      after: " Bebas",
    });
  });

  it("kutip keriting hasil wptexturize cocok dengan frasa mentah — dan yang dirender glyph judulnya", () => {
    // Judul rendered REST membawa ‘…’; frasa dari wp-admin tersimpan
    // mentah dengan '…'. match harus potongan judul (kutip keriting), bukan
    // frasa tersimpan.
    expect(splitHighlight("Menimbang ‘Poros Maritim’ Baru", "'Poros Maritim'")).toEqual({
      before: "Menimbang ",
      match: "‘Poros Maritim’",
      after: " Baru",
    });
  });

  it("en-dash judul cocok dengan tanda hubung frasa", () => {
    expect(splitHighlight("Poros Jakarta–Beijing Menguat", "Jakarta-Beijing")).toEqual({
      before: "Poros ",
      match: "Jakarta–Beijing",
      after: " Menguat",
    });
  });
});

describe("articleImage & placeholderImage", () => {
  const artikel = (over: Partial<Article> = {}): Article => ({
    slug: "contoh",
    title: "Contoh",
    excerpt: "",
    category: "analisis",
    author: "redaksi",
    date: "2026-08-25",
    imageSeed: "contoh",
    body: [],
    ...over,
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("memakai imageUrl WordPress bila ada", () => {
    expect(
      articleImage(artikel({ imageUrl: "https://cms.x/foto.jpg" }), 1200, 675)
    ).toBe("https://cms.x/foto.jpg");
  });

  it("tanpa imageUrl jatuh ke aset brand lokal + mencatat peringatan", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(articleImage(artikel(), 1200, 675)).toBe(
      "/images/peta-dunia-engraving-antik.jpg"
    );
    expect(warn).toHaveBeenCalledOnce();
  });

  it("rasio potret (sampul buku) memakai aset potret", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(placeholderImage("buku-x", 816, 1088)).toBe(
      "/images/tekstur-kertas-editorial.jpg"
    );
  });
});

describe("formatDate", () => {
  it("default bahasa Indonesia — perilaku lama tidak berubah", () => {
    expect(formatDate("2026-08-19")).toBe("19 Agustus 2026");
  });

  it("varian Inggris memakai en-GB agar urutan hari-bulan-tahun tetap", () => {
    expect(formatDate("2026-08-19", "en")).toBe("19 August 2026");
    expect(formatDate("2026-01-02", "en")).toBe("2 January 2026");
  });
});
