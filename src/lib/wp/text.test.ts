import { describe, expect, it } from "vitest";
import { cleanExcerpt, cleanText, htmlParagraphs } from "./text";

describe("cleanText", () => {
  it("strip tag + decode entity + rapikan spasi", () => {
    expect(cleanText("<p>Dolar &amp; Rupiah</p>")).toBe("Dolar & Rupiah");
  });

  it("tanda baca yang menempel tag penutup tidak terdorong spasi", () => {
    // stripTags mengganti tiap tag dengan spasi — "…<a>laporan</a>." dulu
    // menjadi "laporan ." dan bocor sampai meta description.
    expect(cleanText('<p>Menurut <a href="https://x.test">laporan</a>.</p>')).toBe(
      "Menurut laporan."
    );
    expect(cleanText("<p>Kata <em>beliau</em>, begitu.</p>")).toBe(
      "Kata beliau, begitu."
    );
  });

  it("tanda buka tidak menyisakan spasi setelahnya", () => {
    expect(cleanText("<p>(<em>sic</em>) memang begitu</p>")).toBe(
      "(sic) memang begitu"
    );
  });
});

describe("cleanExcerpt", () => {
  it("membuang artefak […] excerpt WordPress", () => {
    expect(cleanExcerpt("<p>Ringkasan [&hellip;]</p>")).toBe("Ringkasan…");
  });
});

describe("htmlParagraphs", () => {
  it("memecah pada </p> dan membuang paragraf kosong", () => {
    expect(htmlParagraphs("<p>Satu.</p><p>Dua.</p><p></p>")).toEqual([
      "Satu.",
      "Dua.",
    ]);
  });
});
