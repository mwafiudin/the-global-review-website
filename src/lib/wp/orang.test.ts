import { describe, expect, it } from "vitest";
import { mastheadDari, orangKePengurus, wpOrangToOrang, type Orang } from "./orang";

const pos = (override: Record<string, unknown> = {}) => ({
  id: 1,
  title: { rendered: "Hendrajit" },
  menu_order: 1,
  featured_media: 10,
  meta: {
    tgr_kelompok: "pengurus",
    tgr_jabatan: "Direktur Eksekutif",
    tgr_jabatan_en: "Executive Director",
    tgr_bio: "Bio Indonesia.",
    tgr_bio_en: "English bio.",
  },
  ...override,
});

describe("wpOrangToOrang", () => {
  it("memetakan pos lengkap", () => {
    const o = wpOrangToOrang(pos(), "https://cms.example/foto.jpg");
    expect(o).toMatchObject({
      nama: "Hendrajit",
      kelompok: "pengurus",
      foto: "https://cms.example/foto.jpg",
      jabatan: "Direktur Eksekutif",
      jabatanEn: "Executive Director",
    });
  });

  it("kolom EN kosong jatuh ke versi Indonesia", () => {
    const o = wpOrangToOrang(
      pos({
        meta: { tgr_kelompok: "pengurus", tgr_jabatan: "Redaktur", tgr_bio: "Bio." },
      })
    );
    expect(o?.jabatanEn).toBe("Redaktur");
    expect(o?.bioEn).toBe("Bio.");
  });

  it("tanpa nama atau jabatan tidak dirender", () => {
    expect(wpOrangToOrang(pos({ title: { rendered: "" } }))).toBeNull();
    expect(wpOrangToOrang(pos({ meta: { tgr_kelompok: "pengurus" } }))).toBeNull();
  });

  it("kelompok liar dianggap pengurus", () => {
    const o = wpOrangToOrang(pos({ meta: { tgr_jabatan: "X", tgr_kelompok: "aneh" } }));
    expect(o?.kelompok).toBe("pengurus");
  });
});

describe("orangKePengurus", () => {
  const dasar: Orang = {
    nama: "Hendrajit",
    urutan: 1,
    kelompok: "pengurus",
    foto: "https://cms.example/foto.jpg",
    jabatan: "Direktur Eksekutif",
    jabatanEn: "Executive Director",
    bio: "Bio Indonesia.",
    bioEn: "English bio.",
  };

  it("membentuk struktur teks dua bahasa", () => {
    expect(orangKePengurus(dasar)).toEqual({
      nama: "Hendrajit",
      foto: "https://cms.example/foto.jpg",
      teks: {
        id: { jabatan: "Direktur Eksekutif", bio: "Bio Indonesia." },
        en: { jabatan: "Executive Director", bio: "English bio." },
      },
    });
  });

  it("kartu pengurus butuh foto dan bio", () => {
    expect(orangKePengurus({ ...dasar, foto: undefined })).toBeNull();
    expect(orangKePengurus({ ...dasar, bio: "" })).toBeNull();
  });
});

describe("mastheadDari", () => {
  it("hanya kelompok redaksi, per bahasa, tanpa butuh foto", () => {
    const daftar: Orang[] = [
      {
        nama: "Hendrajit",
        urutan: 1,
        kelompok: "redaksi",
        jabatan: "Pemimpin Redaksi",
        jabatanEn: "Editor-in-Chief",
        bio: "",
        bioEn: "",
      },
      {
        nama: "Rusman",
        urutan: 2,
        kelompok: "pengurus",
        jabatan: "Direktur TI",
        jabatanEn: "IT Director",
        bio: "Bio.",
        bioEn: "Bio.",
      },
    ];
    const m = mastheadDari(daftar);
    expect(m.id).toEqual([{ peran: "Pemimpin Redaksi", nama: "Hendrajit" }]);
    expect(m.en).toEqual([{ peran: "Editor-in-Chief", nama: "Hendrajit" }]);
  });
});
