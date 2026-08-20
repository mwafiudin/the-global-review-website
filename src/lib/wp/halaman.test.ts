import { describe, expect, it } from "vitest";
import { alamatKantor, hubungiKamiCopy } from "@/data/pages/hubungi-kami";
import { tentangGfiCopy } from "@/data/pages/tentang-gfi";
import { tentangTgrCopy } from "@/data/pages/tentang-tgr";
import {
  butir,
  hubungiDariWp,
  pengurusDariWp,
  teks,
  tentangGfiDariWp,
  tentangTgrDariWp,
} from "./halaman";

describe("teks", () => {
  it("urutan cadangan: meta bahasa aktif → meta Indonesia → teks kode", () => {
    expect(teks({ tgr_lead: "Dari WP", tgr_lead_en: "From WP" }, "tgr_lead", "en", "kode")).toBe("From WP");
    expect(teks({ tgr_lead: "Dari WP" }, "tgr_lead", "en", "kode")).toBe("Dari WP");
    expect(teks({}, "tgr_lead", "en", "kode")).toBe("kode");
    expect(teks({ tgr_lead: "  " }, "tgr_lead", "id", "kode")).toBe("kode");
  });

  it("bahasa Indonesia tidak pernah membaca kolom _en", () => {
    expect(teks({ tgr_lead_en: "From WP" }, "tgr_lead", "id", "kode")).toBe("kode");
  });
});

describe("butir", () => {
  it("memecah satu item per baris dan membuang baris kosong", () => {
    expect(butir({ tgr_isu_butir: "Satu\n\n  Dua  \r\nTiga" }, "tgr_isu_butir", "id", [])).toEqual([
      "Satu",
      "Dua",
      "Tiga",
    ]);
  });

  it("meta kosong memakai daftar dari kode", () => {
    expect(butir({}, "tgr_isu_butir", "id", ["kode"])).toEqual(["kode"]);
  });
});

describe("penggabungan per halaman (meta kosong = render identik)", () => {
  it("tentang-tgr: tanpa meta persis sama dengan modul kode", () => {
    expect(tentangTgrDariWp("id", {})).toEqual(tentangTgrCopy.id);
    expect(tentangTgrDariWp("en", {})).toEqual(tentangTgrCopy.en);
  });

  it("tentang-gfi: tanpa meta persis sama dengan modul kode", () => {
    expect(tentangGfiDariWp("id", {})).toEqual(tentangGfiCopy.id);
    expect(tentangGfiDariWp("en", {})).toEqual(tentangGfiCopy.en);
  });

  it("tentang-gfi: field WP menimpa hanya bagiannya", () => {
    const hasil = tentangGfiDariWp("id", {
      tgr_visi: "Visi baru dari WP.",
      tgr_misi_butir: "Misi A\nMisi B",
    });
    expect(hasil.visiQuote).toBe("Visi baru dari WP.");
    expect(hasil.misi).toEqual(["Misi A", "Misi B"]);
    expect(hasil.isuPokok).toEqual(tentangGfiCopy.id.isuPokok);
  });

  it("pengurus: pengantar jadi satu paragraf dari kode saat meta kosong", () => {
    const hasil = pengurusDariWp("id", {});
    expect(hasil.pengantar).toHaveLength(1);
  });

  it("hubungi-kami: alamat kode terpecah per baris, jam ikut bahasa", () => {
    const hasil = hubungiDariWp("en", {});
    expect(hasil.alamat).toEqual(alamatKantor.split("\n"));
    expect(hasil.copy.jamTeks).toBe(hubungiKamiCopy.en.jamTeks);
    expect(hasil.copy.kanal).toEqual(hubungiKamiCopy.en.kanal);
  });

  it("hubungi-kami: meta menimpa alamat dan lokasi peta", () => {
    const hasil = hubungiDariWp("id", {
      tgr_alamat: "Gedung Baru\nJl. Contoh No. 1",
      tgr_peta_q: "Jl. Contoh No. 1, Jakarta",
    });
    expect(hasil.alamat).toEqual(["Gedung Baru", "Jl. Contoh No. 1"]);
    expect(hasil.petaQ).toBe("Jl. Contoh No. 1, Jakarta");
  });
});
