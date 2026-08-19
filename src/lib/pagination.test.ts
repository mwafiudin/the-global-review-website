import { describe, expect, it } from "vitest";
import { halamanHref, halamanWindow, parseHalaman } from "./pagination";

describe("parseHalaman", () => {
  it("memisahkan ekor /halaman/{n} dari rubrik", () => {
    expect(parseHalaman(["geopolitik", "halaman", "2"])).toEqual({
      rubrik: ["geopolitik"],
      page: 2,
      explicit: true,
    });
    expect(
      parseHalaman(["internasional", "asia-tenggara", "halaman", "13"])
    ).toEqual({
      rubrik: ["internasional", "asia-tenggara"],
      page: 13,
      explicit: true,
    });
  });

  it("tanpa ekor paginasi → halaman 1, segmen utuh", () => {
    expect(parseHalaman(["geopolitik"])).toEqual({
      rubrik: ["geopolitik"],
      page: 1,
      explicit: false,
    });
    expect(parseHalaman(["internasional", "asia-timur"])).toEqual({
      rubrik: ["internasional", "asia-timur"],
      page: 1,
      explicit: false,
    });
  });

  it("nomor tidak sah dibiarkan jadi slug rubrik (jatuh ke 404)", () => {
    for (const buruk of ["0", "-1", "02", "2x", "1.5", ""]) {
      const hasil = parseHalaman(["geopolitik", "halaman", buruk]);
      expect(hasil.page).toBe(1);
      expect(hasil.explicit).toBe(false);
      expect(hasil.rubrik).toEqual(["geopolitik", "halaman", buruk]);
    }
  });

  it("'halaman' tanpa rubrik di depannya bukan paginasi", () => {
    // /category/halaman/2 → rubrik bernama "halaman"? Tidak ada; biarkan
    // utuh supaya gerbang rubrikAda yang memutuskan 404.
    expect(parseHalaman(["halaman", "2"])).toEqual({
      rubrik: ["halaman", "2"],
      page: 1,
      explicit: false,
    });
  });
});

describe("halamanHref", () => {
  it("halaman 1 kembali ke URL kanonis rubrik", () => {
    expect(halamanHref("geopolitik", 1)).toBe("/category/geopolitik");
    expect(halamanHref("geopolitik", 0)).toBe("/category/geopolitik");
  });

  it("halaman berikutnya memakai ekor /halaman/{n}", () => {
    expect(halamanHref("internasional/afrika", 3)).toBe(
      "/category/internasional/afrika/halaman/3"
    );
  });
});

describe("halamanWindow", () => {
  it("arsip pendek: semua nomor tampil tanpa elipsis", () => {
    expect(halamanWindow(2, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(halamanWindow(1, 1)).toEqual([1]);
  });

  it("arsip panjang: ujung + jendela sekitar halaman aktif", () => {
    expect(halamanWindow(5, 20)).toEqual([1, null, 4, 5, 6, null, 20]);
  });

  it("jendela di tepi tidak menghasilkan elipsis kosong", () => {
    expect(halamanWindow(1, 20)).toEqual([1, 2, null, 20]);
    expect(halamanWindow(20, 20)).toEqual([1, null, 19, 20]);
    expect(halamanWindow(2, 8)).toEqual([1, 2, 3, null, 8]);
  });
});
