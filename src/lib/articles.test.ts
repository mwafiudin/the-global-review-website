import { describe, expect, it } from "vitest";
import { categoryName } from "./articles";

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
