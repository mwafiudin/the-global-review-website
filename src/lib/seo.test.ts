import { describe, expect, it } from "vitest";

import { gambarBagikan, ogArtikel } from "./seo";

const SITUS = "https://theglobal-review.com";

describe("gambarBagikan", () => {
  // Lewat wsrv, pratinjau WhatsApp kehilangan gambarnya: ukuran yang baru
  // pertama diminta dibuat proxy dari nol, dan crawler tidak menunggu.
  it("menyajikan gambar CMS dari domain sendiri, bukan proxy pihak ketiga", () => {
    const url = gambarBagikan(
      "https://cms.theglobal-review.com/wp-content/uploads/2026/09/foto.jpg",
      SITUS
    );
    expect(url).toBe(`${SITUS}/wp-content/uploads/2026/09/foto.jpg`);
    expect(url).not.toContain("wsrv");
  });

  it("meneruskan berkas lokal apa adanya, hanya dijadikan absolut", () => {
    expect(gambarBagikan("/images/pengganti.jpg", SITUS)).toBe(
      `${SITUS}/images/pengganti.jpg`
    );
  });

  // Gambar dari host lain tidak punya jalur rewrite di next.config, jadi
  // menulis ulangnya justru menghasilkan URL yang tidak ada.
  it("membiarkan gambar dari host lain apa adanya", () => {
    const luar = "https://i.ytimg.com/vi/abc/hqdefault.jpg";
    expect(gambarBagikan(luar, SITUS)).toBe(luar);
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

  it("memakai gambar artikel dari domain sendiri, tanpa dimensi karangan", () => {
    const gambar = (hasil.openGraph?.images as Array<Record<string, unknown>>)[0];
    expect(String(gambar.url)).toBe(`${SITUS}/wp-content/uploads/foto.jpg`);
    // Dimensi TIDAK dideklarasikan: gambar unggulan TGR aslinya 640-780px
    // dan ukurannya berbeda-beda, jadi angka tetap apa pun akan berbohong.
    expect(gambar.width).toBeUndefined();
    expect(gambar.height).toBeUndefined();
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
