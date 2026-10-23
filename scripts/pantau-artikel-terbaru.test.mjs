import { describe, expect, it } from "vitest";
import { nilai } from "./pantau-artikel-terbaru.mjs";

const dasar = {
  slug: "tulisan-baru",
  terbitGmt: "2026-10-23T02:04:22",
  graceMenit: 20,
};
const menitSetelahTerbit = (m) => Date.parse("2026-10-23T02:04:22Z") + m * 60000;

describe("nilai", () => {
  it("sehat bila artikel 200 dan sudah di beranda", () => {
    expect(
      nilai({ ...dasar, sekarang: menitSetelahTerbit(30), statusArtikel: 200, berandaHtml: "<a href=\"/tulisan-baru\">" })
    ).toEqual([]);
  });

  it("belum di beranda tapi masih dalam masa tenggang: belum dianggap masalah", () => {
    expect(nilai({ ...dasar, sekarang: menitSetelahTerbit(5), statusArtikel: 200, berandaHtml: "" })).toEqual([]);
  });

  it("insiden 23 Okt: artikel timeout dan beranda basi", () => {
    const masalah = nilai({ ...dasar, sekarang: menitSetelahTerbit(150), statusArtikel: undefined, berandaHtml: "" });
    expect(masalah).toHaveLength(2);
    expect(masalah[0]).toContain("timeout");
    expect(masalah[1]).toContain("150 menit");
  });

  it("artikel 404 tetap dilaporkan walau masih masa tenggang", () => {
    expect(nilai({ ...dasar, sekarang: menitSetelahTerbit(1), statusArtikel: 404, berandaHtml: "" })).toHaveLength(1);
  });
});
