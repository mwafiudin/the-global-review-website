import { describe, expect, it } from "vitest";
import { hubungiKamiCopy } from "./hubungi-kami";
import { pengurus, pengurusGfiCopy } from "./pengurus-gfi";
import { redaksiCopy } from "./redaksi";
import { tentangGfiCopy } from "./tentang-gfi";
import { tentangTgrCopy } from "./tentang-tgr";

/**
 * Paritas struktural (jumlah field/elemen) sudah dikunci TypeScript lewat
 * Record<Lang, …>. Tes ini menjaga hal yang tidak bisa dicek kompiler:
 * panjang array yang sama antar bahasa (ikon di-zip lewat indeks) dan
 * terjemahan yang benar-benar diterjemahkan, bukan salin-tempel.
 */

describe("paritas copy halaman statis", () => {
  it("panjang array id dan en sama (ikon di-zip lewat indeks)", () => {
    expect(tentangTgrCopy.en.paragraphs).toHaveLength(
      tentangTgrCopy.id.paragraphs.length
    );
    expect(tentangGfiCopy.en.pembuka).toHaveLength(tentangGfiCopy.id.pembuka.length);
    expect(tentangGfiCopy.en.isuPokok).toHaveLength(tentangGfiCopy.id.isuPokok.length);
    expect(tentangGfiCopy.en.misi).toHaveLength(tentangGfiCopy.id.misi.length);
    expect(tentangGfiCopy.en.fokusKegiatan).toHaveLength(
      tentangGfiCopy.id.fokusKegiatan.length
    );
    expect(redaksiCopy.en.masthead).toHaveLength(redaksiCopy.id.masthead.length);
    expect(redaksiCopy.en.pedoman).toHaveLength(redaksiCopy.id.pedoman.length);
    expect(hubungiKamiCopy.en.kanal).toHaveLength(hubungiKamiCopy.id.kanal.length);
  });

  it("teks en berbeda dari id (bukan salin-tempel)", () => {
    expect(tentangTgrCopy.en.paragraphs[0]).not.toBe(tentangTgrCopy.id.paragraphs[0]);
    expect(tentangGfiCopy.en.misi[0]).not.toBe(tentangGfiCopy.id.misi[0]);
    expect(redaksiCopy.en.pedoman[0].teks).not.toBe(redaksiCopy.id.pedoman[0].teks);
    expect(hubungiKamiCopy.en.kanal[0].teks).not.toBe(hubungiKamiCopy.id.kanal[0].teks);
    expect(pengurusGfiCopy.en.pengantar).not.toBe(pengurusGfiCopy.id.pengantar);
  });

  it("setiap pengurus punya jabatan dan bio di kedua bahasa", () => {
    for (const p of pengurus) {
      expect(p.teks.id.jabatan.length).toBeGreaterThan(0);
      expect(p.teks.en.jabatan.length).toBeGreaterThan(0);
      expect(p.teks.id.bio.length).toBeGreaterThan(0);
      expect(p.teks.en.bio.length).toBeGreaterThan(0);
      expect(p.teks.en.bio).not.toBe(p.teks.id.bio);
    }
  });

  it("nama orang tidak ikut 'diterjemahkan' di masthead", () => {
    const namaId = redaksiCopy.id.masthead.map((m) => m.nama);
    const namaEn = redaksiCopy.en.masthead.map((m) => m.nama);
    expect(namaEn).toEqual(namaId);
  });
});
