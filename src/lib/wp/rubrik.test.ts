import { describe, expect, it, vi } from "vitest";
import type { WpCategory, WpTerm } from "./client";
import { feCategoryFor, feCategoryForIds } from "./rubrik";

/**
 * Tabel WP_TO_FE masih memuat baris TODO(editorial) yang akan berubah begitu
 * redaksi memutuskan dan 04-rubrik.sh dijalankan. Tes ini mengunci ATURAN
 * pemilihannya (terdalam menang, seri → baris lebih atas), bukan isi tabelnya.
 */

const term = (slug: string, taxonomy = "category"): WpTerm => ({
  id: 1,
  slug,
  name: slug,
  taxonomy,
});

const category = (id: number, slug: string): WpCategory => ({
  id,
  slug,
  name: slug,
  parent: 0,
  count: 1,
});

describe("feCategoryFor", () => {
  it("memilih jalur terdalam, apa pun urutan termnya", () => {
    expect(feCategoryFor([term("internasional"), term("asia-tenggara")])).toBe(
      "internasional/asia-tenggara"
    );
    expect(feCategoryFor([term("asia-tenggara"), term("internasional")])).toBe(
      "internasional/asia-tenggara"
    );
  });

  it("pada kedalaman seri, baris tabel lebih atas menang", () => {
    // diplomasi berada di atas hukum, jadi urutan input tidak berpengaruh.
    expect(feCategoryFor([term("hukum"), term("diplomasi")])).toBe("diplomasi");
  });

  it("memetakan slug gabungan ke rubrik induknya", () => {
    expect(feCategoryFor([term("militer")])).toBe("politik-keamanan");
    expect(feCategoryFor([term("intelijen")])).toBe("politik-keamanan");
  });

  it("mengabaikan term non-kategori", () => {
    expect(feCategoryFor([term("asia-tenggara", "post_tag")])).toBe("analisis");
  });

  it("jatuh ke analisis hanya bila tidak ada kategori sama sekali", () => {
    expect(feCategoryFor([])).toBe("analisis");
    expect(feCategoryFor([term("asia-tenggara", "post_tag")])).toBe("analisis");
  });

  it("kategori baru yang belum dipetakan memakai slug-nya sendiri", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Dulu dilabeli "analisis" — pembaca diberi rubrik yang salah tanpa jejak.
    expect(feCategoryFor([term("kripto-aset")])).toBe("kripto-aset");
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("kategori terpetakan tetap menang atas yang belum dipetakan", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(feCategoryFor([term("kripto-aset"), term("diplomasi")])).toBe(
      "diplomasi"
    );
    expect(feCategoryFor([term("kripto-aset"), term("asia-tenggara")])).toBe(
      "internasional/asia-tenggara"
    );
    warn.mockRestore();
  });
});

describe("feCategoryForIds", () => {
  const categories = [category(10, "hukum"), category(20, "asia-tenggara")];

  it("meresolusi id term lewat daftar kategori yang disuplai", () => {
    expect(feCategoryForIds([10], categories)).toBe("hukum");
    expect(feCategoryForIds([10, 20], categories)).toBe("internasional/asia-tenggara");
  });

  it("jatuh ke analisis bila id kosong atau tak dikenal", () => {
    expect(feCategoryForIds([], categories)).toBe("analisis");
    expect(feCategoryForIds([99], categories)).toBe("analisis");
  });
});
