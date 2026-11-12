import { describe, expect, it } from "vitest";
import { normalisasiKueri } from "./route";

describe("normalisasiKueri", () => {
  it("kueri biasa: huruf kecil, spasi dirapikan", () => {
    expect(normalisasiKueri("  Laut   China Selatan ")).toBe("laut china selatan");
    expect(normalisasiKueri("covid-19")).toBe("covid-19");
    expect(normalisasiKueri("Al-Qur'an")).toBe("al-qur'an");
    expect(normalisasiKueri("فلسطين")).toBe("فلسطين");
  });

  it("tanda baca jadi spasi, bukan dibuang rapat", () => {
    expect(normalisasiKueri("U.S.-China")).toBe("u s -china");
    expect(normalisasiKueri("BRICS, ASEAN")).toBe("brics asean");
  });

  it("muatan pemindai tidak diteruskan apa adanya", () => {
    expect(normalisasiKueri("../../etc/passwd")).toBe("etc passwd");
    expect(normalisasiKueri("<script>alert(1)</script>")).toBe("script alert 1 script");
    expect(normalisasiKueri("1' OR '1'='1")).not.toMatch(/[=<>./\\]/);
    expect(normalisasiKueri("%00;|`$()")).toBe("00");
  });

  it("dipotong 100 karakter; hanya tanda baca berarti kosong", () => {
    expect(normalisasiKueri("a".repeat(300))).toHaveLength(100);
    expect(normalisasiKueri("../..")).toBe("");
  });
});
