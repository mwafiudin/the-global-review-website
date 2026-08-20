import { describe, expect, it } from "vitest";
import {
  ELEMENT_CALLBACK,
  ELEMENT_DIV_ID,
  ELEMENT_SCRIPT_SRC,
  ELEMENT_STYLE,
  penghapusGoogtrans,
} from "./element";

describe("konstanta pemasangan Selat", () => {
  it("URL skrip memakai nama callback yang sama", () => {
    expect(ELEMENT_SCRIPT_SRC).toContain(`cb=${ELEMENT_CALLBACK}`);
    expect(ELEMENT_SCRIPT_SRC).toMatch(/^https:\/\/translate\.google\.com\//);
  });

  it("CSS penetral menyembunyikan banner Google dan placeholder widget", () => {
    expect(ELEMENT_STYLE).toContain("div.skiptranslate");
    expect(ELEMENT_STYLE).toContain(`#${ELEMENT_DIV_ID}`);
    expect(ELEMENT_STYLE).toContain("display:none!important");
  });

  it("CSS penetral membatalkan offset banner pada body", () => {
    expect(ELEMENT_STYLE).toContain("body{top:0!important}");
  });

  it("CSS penetral membersihkan highlight pada <font> suntikan Google", () => {
    expect(ELEMENT_STYLE).toContain("font font{background-color:transparent");
  });
});

describe("penghapusGoogtrans", () => {
  it("memusnahkan varian tanpa domain, host, dan host bertitik", () => {
    const resep = penghapusGoogtrans("theglobal-review.com");
    expect(resep).toHaveLength(3);
    expect(resep[0]).not.toContain("domain=");
    expect(resep).toContainEqual(
      expect.stringContaining("domain=theglobal-review.com")
    );
    expect(resep).toContainEqual(
      expect.stringContaining("domain=.theglobal-review.com")
    );
  });

  it("menambah domain induk untuk subdomain", () => {
    const resep = penghapusGoogtrans("www.theglobal-review.com");
    expect(resep).toContainEqual(
      expect.stringContaining("domain=.theglobal-review.com")
    );
  });

  it("setiap resep kedaluwarsa di masa lalu dan ber-path akar", () => {
    for (const r of penghapusGoogtrans("localhost")) {
      expect(r).toContain("expires=Thu, 01 Jan 1970");
      expect(r).toContain("path=/");
    }
  });
});
