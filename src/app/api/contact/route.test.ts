import { describe, expect, it } from "vitest";
import { DAFTAR_SUBJEK, emailValid, kontakValid, terlaluSering } from "./route";

describe("emailValid", () => {
  it("menerima alamat yang wajar", () => {
    expect(emailValid("pembaca@gmail.com")).toBe(true);
    expect(emailValid("nama.belakang+tag@sub.domain.co.id")).toBe(true);
  });

  it("menolak yang tidak berbentuk alamat", () => {
    for (const buruk of ["", "tanpa-at", "a@b", "dua@@at.com", 123, null]) {
      expect(emailValid(buruk)).toBe(false);
    }
  });
});

describe("kontakValid", () => {
  const sah = {
    nama: "Budi Santoso",
    email: "budi@example.com",
    telepon: "0812-3456-7890",
    subjek: "Pertanyaan Umum",
    pesan: "Halo redaksi.",
  };

  it("meloloskan kiriman lengkap dan merapikan spasinya", () => {
    const hasil = kontakValid({ ...sah, nama: "  Budi Santoso  " });
    expect(hasil.galat).toBeNull();
    if (hasil.galat === null) expect(hasil.data.nama).toBe("Budi Santoso");
  });

  it("telepon dan subjek boleh kosong", () => {
    expect(kontakValid({ ...sah, telepon: "", subjek: "" }).galat).toBeNull();
    expect(kontakValid({ ...sah, telepon: undefined, subjek: undefined }).galat).toBeNull();
  });

  it("nama wajib dan dibatasi 120 karakter", () => {
    expect(kontakValid({ ...sah, nama: "" }).galat).toBe("Nama wajib diisi");
    expect(kontakValid({ ...sah, nama: "   " }).galat).toBe("Nama wajib diisi");
    expect(kontakValid({ ...sah, nama: "a".repeat(121) }).galat).toBe("Nama wajib diisi");
  });

  it("email diperiksa bentuknya", () => {
    expect(kontakValid({ ...sah, email: "bukan-email" }).galat).toBe(
      "Alamat email tidak sah"
    );
  });

  it("pesan wajib dan dibatasi 5000 karakter", () => {
    expect(kontakValid({ ...sah, pesan: "" }).galat).toBe("Pesan wajib diisi");
    expect(kontakValid({ ...sah, pesan: "a".repeat(5001) }).galat).toBe(
      "Pesan terlalu panjang"
    );
  });

  it("subjek liar ditolak, seluruh pilihan resmi lolos", () => {
    expect(kontakValid({ ...sah, subjek: "=cmd|hack" }).galat).toBe(
      "Subjek tidak dikenal"
    );
    for (const subjek of DAFTAR_SUBJEK) {
      expect(kontakValid({ ...sah, subjek }).galat).toBeNull();
    }
  });

  it("telepon terlalu panjang ditolak", () => {
    expect(kontakValid({ ...sah, telepon: "0".repeat(41) }).galat).toBe(
      "Nomor telepon terlalu panjang"
    );
  });
});

describe("terlaluSering", () => {
  it("melewatkan lima kiriman pertama, menahan yang keenam", () => {
    const t0 = 1_000_000;
    for (let i = 1; i <= 5; i++) {
      expect(terlaluSering("ip-a", t0 + i)).toBe(false);
    }
    expect(terlaluSering("ip-a", t0 + 6)).toBe(true);
  });

  it("jendela bergulir: menerima lagi setelah lewat satu menit", () => {
    const t0 = 2_000_000;
    for (let i = 1; i <= 6; i++) terlaluSering("ip-b", t0 + i);
    expect(terlaluSering("ip-b", t0 + 61_000)).toBe(false);
  });
});
