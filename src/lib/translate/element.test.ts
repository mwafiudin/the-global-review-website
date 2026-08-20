import { describe, expect, it } from "vitest";
import {
  ELEMENT_CALLBACK,
  ELEMENT_SCRIPT_SRC,
  bahasaGoogtrans,
  penghapusGoogtrans,
} from "./element";

describe("bahasaGoogtrans", () => {
  it("membaca bahasa tujuan dari cookie googtrans", () => {
    expect(bahasaGoogtrans("googtrans=/id/en")).toBe("en");
  });

  it("menemukan googtrans di antara cookie lain", () => {
    expect(bahasaGoogtrans("tgr-theme=dark; googtrans=/id/en; a=b")).toBe("en");
  });

  it("memahami nilai yang ter-encode", () => {
    expect(bahasaGoogtrans("googtrans=%2Fid%2Fen")).toBe("en");
  });

  it("null bila cookie tak ada atau bentuknya tak dikenal", () => {
    expect(bahasaGoogtrans("")).toBeNull();
    expect(bahasaGoogtrans("tgr-theme=dark")).toBeNull();
    expect(bahasaGoogtrans("googtrans=")).toBeNull();
    expect(bahasaGoogtrans("googtrans=ngawur")).toBeNull();
  });

  it("tidak tertipu cookie yang berakhiran googtrans", () => {
    expect(bahasaGoogtrans("xgoogtrans=/id/en")).toBeNull();
  });
});

describe("penghapusGoogtrans", () => {
  it("memusnahkan varian tanpa domain, host, dan host bertitik", () => {
    const resep = penghapusGoogtrans("theglobal-review.com");
    expect(resep).toHaveLength(3);
    expect(resep[0]).not.toContain("domain=");
    expect(resep).toContainEqual(expect.stringContaining("domain=theglobal-review.com"));
    expect(resep).toContainEqual(expect.stringContaining("domain=.theglobal-review.com"));
  });

  it("menambah domain induk untuk subdomain", () => {
    const resep = penghapusGoogtrans("www.theglobal-review.com");
    expect(resep).toContainEqual(expect.stringContaining("domain=.theglobal-review.com"));
  });

  it("setiap resep kedaluwarsa di masa lalu dan ber-path akar", () => {
    for (const r of penghapusGoogtrans("localhost")) {
      expect(r).toContain("expires=Thu, 01 Jan 1970");
      expect(r).toContain("path=/");
    }
  });
});

describe("konstanta pemasangan", () => {
  it("URL skrip memakai nama callback yang sama", () => {
    expect(ELEMENT_SCRIPT_SRC).toContain(`cb=${ELEMENT_CALLBACK}`);
  });
});
