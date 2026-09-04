import { describe, expect, it } from "vitest";

import { gambarBagikan, ogArtikel } from "./seo";

const SITUS = "https://theglobal-review.com";

describe("gambarBagikan", () => {
  it("menormalkan gambar jauh ke 1200x630 JPEG lewat wsrv", () => {
    const url = gambarBagikan(
      "https://cms.theglobal-review.com/wp-content/uploads/2026/09/foto.jpg",
      SITUS
    );
    expect(url).toContain("wsrv.nl");
    expect(url).toContain("w=1200");
    expect(url).toContain("h=630");
    expect(url).toContain("fit=cover");
    // JPEG, bukan WebP: dukungan WebP di crawler sosial tidak merata, dan
    // pratinjau yang gagal ter-cache lama di sisi mereka.
    expect(url).toContain("output=jpg");
  });

  // Berkas lokal sudah tersaji dari CDN Vercel; melewatkannya ke pihak
  // ketiga hanya menambah titik gagal pada jalur yang sudah andal.
  it("meneruskan berkas lokal apa adanya, hanya dijadikan absolut", () => {
    expect(gambarBagikan("/images/pengganti.jpg", SITUS)).toBe(
      `${SITUS}/images/pengganti.jpg`
    );
  });
});

describe("ogArtikel", () => {
  const hasil = ogArtikel({
    judul: "Ekonomi Politik NU dan Pesantren",
    deskripsi: "Catatan pasca muktamar.",
    gambar: "https://cms.theglobal-review.com/wp-content/uploads/foto.jpg",
    situs: SITUS,
    path: "/ekonomi-politik-nu",
    lang: "id",
    tanggal: "2026-09-01",
    penulis: "Rusman",
  });

  it("memakai judul dan deskripsi artikel, bukan warisan situs", () => {
    expect(hasil.openGraph?.title).toBe("Ekonomi Politik NU dan Pesantren");
    expect(hasil.openGraph?.description).toBe("Catatan pasca muktamar.");
    expect(hasil.twitter?.title).toBe("Ekonomi Politik NU dan Pesantren");
  });

  it("bertipe article beserta tanggal terbit dan penulisnya", () => {
    const og = hasil.openGraph as Record<string, unknown>;
    expect(og.type).toBe("article");
    expect(og.publishedTime).toBe("2026-09-01");
    expect(og.authors).toEqual(["Rusman"]);
  });

  it("memakai gambar artikel dengan dimensi yang dinyatakan", () => {
    const gambar = (hasil.openGraph?.images as Array<Record<string, unknown>>)[0];
    expect(String(gambar.url)).toContain("wsrv.nl");
    // Dimensi dinyatakan supaya platform sosial memesan ruangnya lebih dulu
    // dan tidak menunda render pratinjau sampai gambarnya selesai diunduh.
    expect(gambar.width).toBe(1200);
    expect(gambar.height).toBe(630);
  });

  it("menautkan URL berbahasa untuk versi /en", () => {
    const en = ogArtikel({
      judul: "x", deskripsi: "y", gambar: "/a.jpg", situs: SITUS,
      path: "/artikel", lang: "en",
    });
    expect(en.openGraph?.url).toBe("/en/artikel");
    expect(en.openGraph?.locale).toBe("en_US");
  });
});
