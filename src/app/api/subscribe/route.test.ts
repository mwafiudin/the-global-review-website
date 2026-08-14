import { describe, expect, it } from "vitest";
import { emailValid, terlaluSering } from "./route";

describe("emailValid", () => {
  it("menerima alamat yang wajar", () => {
    expect(emailValid("redaksi@theglobal-review.com")).toBe(true);
    expect(emailValid("nama.belakang+tag@sub.domain.co.id")).toBe(true);
  });

  it("menolak yang tidak berbentuk alamat", () => {
    for (const buruk of [
      "",
      "tanpa-at",
      "a@b", // tanpa titik → bukan domain
      "spasi di@tengah.com",
      "dua@@at.com",
      `${"a".repeat(250)}@panjang.com`,
      123,
      null,
      undefined,
    ]) {
      expect(emailValid(buruk)).toBe(false);
    }
  });
});

describe("terlaluSering", () => {
  it("melewatkan lima kiriman pertama, menahan yang keenam", () => {
    const t0 = 1_000_000;
    for (let i = 1; i <= 5; i++) {
      expect(terlaluSering("ip-a", t0 + i)).toBe(false);
    }
    expect(terlaluSering("ip-a", t0 + 6)).toBe(true);
  });

  it("jendela bergulir: menerima lagi setelah lewat satu menit", () => {
    const t0 = 2_000_000;
    for (let i = 1; i <= 6; i++) terlaluSering("ip-b", t0 + i);
    expect(terlaluSering("ip-b", t0 + 61_000)).toBe(false);
  });

  it("menghitung per alamat, bukan global", () => {
    const t0 = 3_000_000;
    for (let i = 1; i <= 6; i++) terlaluSering("ip-c", t0 + i);
    expect(terlaluSering("ip-d", t0 + 7)).toBe(false);
  });
});
