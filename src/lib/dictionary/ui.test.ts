import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { categoryNames, lainnyaGroups, mainMenu, topBarMenu } from "@/data/site";
import { EN } from "./ui";

/**
 * Penjaga kelengkapan kamus: setiap string yang lewat t() harus punya entri
 * EN. Tanpa ini, entri yang hilang lolos diam-diam — t() jatuh kembali ke
 * bahasa Indonesia dan tak ada yang sadar sampai pembaca EN menemukannya.
 */

const SRC = join(__dirname, "..", "..");

function daftarBerkasTsx(dir: string): string[] {
  const hasil: string[] = [];
  for (const nama of readdirSync(dir)) {
    const penuh = join(dir, nama);
    if (statSync(penuh).isDirectory()) hasil.push(...daftarBerkasTsx(penuh));
    else if (nama.endsWith(".tsx") && !nama.endsWith(".test.tsx")) hasil.push(penuh);
  }
  return hasil;
}

/** Argumen literal t("…") / t('…'), termasuk yang berpisah baris. */
function kunciLiteralT(kode: string): string[] {
  const kunci: string[] = [];
  const re = /\bt\(\s*(["'])((?:\\.|(?!\1)[^\\])*?)\1\s*[),]/g;
  for (const m of kode.matchAll(re)) {
    kunci.push(m[2].replace(/\\(["'\\])/g, "$1"));
  }
  return kunci;
}

describe("kamus EN", () => {
  it('mencakup setiap literal t("…") di components/ dan app/', () => {
    const berkas = [
      ...daftarBerkasTsx(join(SRC, "components")),
      ...daftarBerkasTsx(join(SRC, "app")),
    ];
    const hilang = new Map<string, string>();
    for (const b of berkas) {
      for (const k of kunciLiteralT(readFileSync(b, "utf-8"))) {
        if (!(k in EN)) hilang.set(k, b.slice(SRC.length + 1));
      }
    }
    expect(
      [...hilang].map(([k, b]) => `"${k}" (${b})`),
      "string di bawah ini dipakai lewat t() tapi belum punya entri EN"
    ).toEqual([]);
  });

  it("mencakup seluruh label menu dan nama rubrik dari site.ts", () => {
    const label = new Set<string>();
    for (const item of topBarMenu) label.add(item.label);
    for (const item of mainMenu) {
      label.add(item.label);
      for (const anak of item.children ?? []) label.add(anak.label);
    }
    for (const grup of lainnyaGroups) {
      label.add(grup.label);
      for (const item of grup.items) label.add(item.label);
    }
    for (const nama of Object.values(categoryNames)) label.add(nama);

    const hilang = [...label].filter((l) => !(l in EN));
    expect(hilang, "label navigasi/rubrik tanpa entri EN").toEqual([]);
  });

  it("mencakup pesan galat API yang tampil di klien", () => {
    // Pesan dari api/subscribe & api/vote yang dirender komponen client.
    const pesan = [
      "Alamat email tidak sah",
      "Terlalu banyak percobaan, coba lagi sebentar lagi",
      "Pendaftaran buletin belum dikonfigurasi",
      "Pendaftaran gagal, coba lagi nanti",
    ];
    const hilang = pesan.filter((p) => !(p in EN));
    expect(hilang, "pesan galat API tanpa entri EN").toEqual([]);
  });
});
