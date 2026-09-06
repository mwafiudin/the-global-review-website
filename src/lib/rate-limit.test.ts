import { describe, expect, it } from "vitest";
import { buatRem } from "./rate-limit";

describe("buatRem", () => {
  it("melewatkan N kejadian pertama, menahan yang ke-N+1", () => {
    const rem = buatRem({ jendelaMs: 60_000, maksPerJendela: 5 });
    const t0 = 1_000_000;
    for (let i = 1; i <= 5; i++) expect(rem.terlaluSering("ip-a", t0 + i)).toBe(false);
    expect(rem.terlaluSering("ip-a", t0 + 6)).toBe(true);
  });

  it("jendela bergulir: menerima lagi setelah jendela lewat", () => {
    const rem = buatRem({ jendelaMs: 60_000, maksPerJendela: 5 });
    const t0 = 2_000_000;
    for (let i = 1; i <= 6; i++) rem.terlaluSering("ip-b", t0 + i);
    expect(rem.terlaluSering("ip-b", t0 + 61_000)).toBe(false);
  });

  it("menghitung per kunci, bukan global", () => {
    const rem = buatRem({ jendelaMs: 60_000, maksPerJendela: 5 });
    const t0 = 3_000_000;
    for (let i = 1; i <= 6; i++) rem.terlaluSering("ip-c", t0 + i);
    expect(rem.terlaluSering("ip-d", t0 + 7)).toBe(false);
  });

  it("panggilan yang sudah ditahan tidak memperpanjang hukuman", () => {
    // Jejak berhenti di N: lima kiriman awal + 10.000 tembakan berikutnya
    // dalam jendela yang sama tetap dilepas tepat 60 dtk setelah kiriman
    // kelima — bukan setelah tembakan terakhir.
    const rem = buatRem({ jendelaMs: 60_000, maksPerJendela: 5 });
    const t0 = 4_000_000;
    for (let i = 1; i <= 5; i++) rem.terlaluSering("ip-e", t0 + i);
    for (let i = 0; i < 10_000; i++) expect(rem.terlaluSering("ip-e", t0 + 100 + i)).toBe(true);
    expect(rem.terlaluSering("ip-e", t0 + 5 + 60_000)).toBe(false);
  });

  it("menyapu kunci basi begitu ambang jumlah kunci tercapai", () => {
    const rem = buatRem({ jendelaMs: 60_000, maksPerJendela: 5, maksKunci: 100 });
    const t0 = 5_000_000;
    for (let i = 0; i < 100; i++) rem.terlaluSering(`ip-${i}`, t0);
    expect(rem.ukuran).toBe(100);

    // Kunci ke-101 datang setelah jendela lewat: seratus kunci lama basi.
    rem.terlaluSering("ip-baru", t0 + 60_000);
    expect(rem.ukuran).toBe(1);
  });

  it("banjir kunci segar tidak menumbuhkan peta melewati batas keras", () => {
    const rem = buatRem({ jendelaMs: 60_000, maksPerJendela: 5, maksKunci: 100 });
    const t0 = 6_000_000;
    for (let i = 0; i < 5_000; i++) rem.terlaluSering(`palsu-${i}`, t0 + i);
    expect(rem.ukuran).toBeLessThanOrEqual(100);
    // Yang tertua yang dibuang, bukan yang paling baru.
    expect(rem.terlaluSering("palsu-4999", t0 + 5_001)).toBe(false);
    expect(rem.ukuran).toBeLessThanOrEqual(100);
  });

  it("sapuan mendahulukan kunci basi; kunci aktif tidak kehilangan hitungannya", () => {
    const rem = buatRem({ jendelaMs: 60_000, maksPerJendela: 5, maksKunci: 10 });
    const t0 = 7_000_000;
    for (let i = 1; i < 10; i++) rem.terlaluSering(`basi-${i}`, t0 - 70_000);
    rem.terlaluSering("ip-0", t0);
    // Peta penuh; kunci baru memaksa sapuan — sembilan yang basi hilang,
    // ip-0 (masih dalam jendela) tetap.
    rem.terlaluSering("ip-baru", t0 + 1);
    expect(rem.ukuran).toBe(2);

    // Hitungan ip-0 harus utuh: satu kejadian di t0 + empat lagi = lima,
    // sehingga yang keenam ditahan. Kalau sapuan menghapus riwayatnya,
    // yang keenam justru lolos.
    for (let i = 1; i <= 4; i++) expect(rem.terlaluSering("ip-0", t0 + 40_000 + i)).toBe(false);
    expect(rem.terlaluSering("ip-0", t0 + 40_005)).toBe(true);
  });

  it("peta penuh kunci aktif: yang tertua dibuang, yang lebih baru tetap dihitung", () => {
    // Kompromi yang disengaja: banjir alamat unik bisa mereset hitungan
    // pengunjung lama, tapi peta tidak pernah tumbuh — WordPress tetap
    // membatasi di lapis kedua.
    const rem = buatRem({ jendelaMs: 60_000, maksPerJendela: 5, maksKunci: 10 });
    const t0 = 8_000_000;
    rem.terlaluSering("tertua", t0);
    for (let i = 1; i < 9; i++) rem.terlaluSering(`ip-${i}`, t0 + i);
    for (let i = 1; i <= 5; i++) rem.terlaluSering("terbaru", t0 + 100 + i);
    expect(rem.ukuran).toBe(10);

    rem.terlaluSering("ip-baru", t0 + 200);
    expect(rem.ukuran).toBe(10);
    expect(rem.terlaluSering("terbaru", t0 + 201)).toBe(true);
    // "tertua" sudah dibuang: hitungannya mulai dari nol lagi.
    expect(rem.terlaluSering("tertua", t0 + 202)).toBe(false);
  });
});
