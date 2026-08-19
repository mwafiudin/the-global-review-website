import { describe, expect, it } from "vitest";
import { categoryName, formatDate } from "./articles";

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

describe("formatDate", () => {
  it("default bahasa Indonesia — perilaku lama tidak berubah", () => {
    expect(formatDate("2026-08-19")).toBe("19 Agustus 2026");
  });

  it("varian Inggris memakai en-GB agar urutan hari-bulan-tahun tetap", () => {
    expect(formatDate("2026-08-19", "en")).toBe("19 August 2026");
    expect(formatDate("2026-01-02", "en")).toBe("2 January 2026");
  });
});
