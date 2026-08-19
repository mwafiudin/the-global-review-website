import { describe, expect, it } from "vitest";
import { alternatePath, localizeHref, planLocaleRouting } from "./locale-routing";

describe("planLocaleRouting", () => {
  it("me-rewrite path tanpa prefiks ke pohon /id", () => {
    expect(planLocaleRouting("/")).toEqual({ type: "rewrite", pathname: "/id" });
    expect(planLocaleRouting("/anatomi-krisis")).toEqual({
      type: "rewrite",
      pathname: "/id/anatomi-krisis",
    });
    expect(planLocaleRouting("/category/analisis/halaman/2")).toEqual({
      type: "rewrite",
      pathname: "/id/category/analisis/halaman/2",
    });
  });

  it("meloloskan pohon /en apa adanya", () => {
    expect(planLocaleRouting("/en")).toEqual({ type: "next" });
    expect(planLocaleRouting("/en/tentang-tgr")).toEqual({ type: "next" });
  });

  it("memulangkan trailing slash permalink WordPress lama", () => {
    expect(planLocaleRouting("/anatomi-krisis/")).toEqual({
      type: "redirect",
      pathname: "/anatomi-krisis",
    });
    expect(planLocaleRouting("/en/tentang-tgr/")).toEqual({
      type: "redirect",
      pathname: "/en/tentang-tgr",
    });
    // Akar situs bukan trailing slash.
    expect(planLocaleRouting("/")).toEqual({ type: "rewrite", pathname: "/id" });
  });

  it("mengarahkan /id/* di address bar kembali ke tanpa prefiks", () => {
    expect(planLocaleRouting("/id")).toEqual({ type: "redirect", pathname: "/" });
    expect(planLocaleRouting("/id/category/analisis")).toEqual({
      type: "redirect",
      pathname: "/category/analisis",
    });
  });

  it("hanya cocok pada batas segmen, bukan awalan string", () => {
    // Slug artikel yang kebetulan berawalan "en"/"id" bukan prefiks bahasa.
    expect(planLocaleRouting("/energi-baru")).toEqual({
      type: "rewrite",
      pathname: "/id/energi-baru",
    });
    expect(planLocaleRouting("/identitas-nasional")).toEqual({
      type: "rewrite",
      pathname: "/id/identitas-nasional",
    });
  });
});

describe("localizeHref", () => {
  it("memprefiks href internal untuk bahasa Inggris", () => {
    expect(localizeHref("/", "en")).toBe("/en");
    expect(localizeHref("/category/analisis", "en")).toBe("/en/category/analisis");
  });

  it("membiarkan bahasa Indonesia dan href non-internal", () => {
    expect(localizeHref("/category/analisis", "id")).toBe("/category/analisis");
    expect(localizeHref("https://x.com/GlobalReview07", "en")).toBe(
      "https://x.com/GlobalReview07"
    );
    expect(localizeHref("mailto:redaksi@tgr.id", "en")).toBe("mailto:redaksi@tgr.id");
    expect(localizeHref("#form-buletin", "en")).toBe("#form-buletin");
  });

  it("idempoten pada href yang sudah berprefiks", () => {
    expect(localizeHref("/en/redaksi", "en")).toBe("/en/redaksi");
  });
});

describe("alternatePath", () => {
  it("memetakan bolak-balik antara kedua pohon", () => {
    expect(alternatePath("/", "en")).toBe("/en");
    expect(alternatePath("/en", "id")).toBe("/");
    expect(alternatePath("/tentang-tgr", "en")).toBe("/en/tentang-tgr");
    expect(alternatePath("/en/tentang-tgr", "id")).toBe("/tentang-tgr");
  });

  it("round-trip mengembalikan path semula", () => {
    for (const p of ["/", "/redaksi", "/category/analisis/halaman/3"]) {
      expect(alternatePath(alternatePath(p, "en"), "id")).toBe(p);
    }
  });

  it("tidak berubah bila target sama dengan bahasa path", () => {
    expect(alternatePath("/en/redaksi", "en")).toBe("/en/redaksi");
    expect(alternatePath("/redaksi", "id")).toBe("/redaksi");
  });
});
