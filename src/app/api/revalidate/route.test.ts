import { describe, expect, it } from "vitest";
import { slugVarian, tagsUntuk } from "./route";

describe("tagsUntuk", () => {
  it("tulisan biasa: tag halaman detail + seluruh daftar", () => {
    expect(tagsUntuk("post", "geopolitik-asia")).toEqual([
      "wp:post:geopolitik-asia",
      "wp:posts",
    ]);
  });

  it("tipe konten khusus memakai tag koleksinya sendiri", () => {
    expect(tagsUntuk("tgr_podcast", "x")).toEqual(["wp:podcasts"]);
    expect(tagsUntuk("tgr_album", "x")).toEqual(["wp:albums"]);
    expect(tagsUntuk("tgr_poll", "x")).toEqual(["wp:polls"]);
    expect(tagsUntuk("tgr_orang", "x")).toEqual(["wp:orang"]);
  });

  it("laman menggugurkan bundel isi halaman statis, bukan wp:posts", () => {
    expect(tagsUntuk("page", "tentang-gfi")).toEqual(["wp:halaman"]);
  });

  it("type warisan Object.prototype tidak lolos sebagai tag palsu", () => {
    // Inilah alasan CPT_TAGS berupa Map: lookup objek biasa akan menemukan
    // "constructor"/"toString" dari prototype dan mengembalikan fungsi.
    expect(tagsUntuk("constructor", "s")).toEqual(["wp:post:s", "wp:posts"]);
    expect(tagsUntuk("toString", "s")).toEqual(["wp:post:s", "wp:posts"]);
  });

  it("kategori & user (mu-plugin ≥1.2) menggugurkan peta + daftar", () => {
    // Rubrik/penulis tiap artikel terpanggang di entri daftar, jadi
    // wp:posts ikut gugur — bukan hanya cache peta yang ber-TTL sehari.
    expect(tagsUntuk("category", "geopolitik")).toEqual([
      "wp:categories",
      "wp:posts",
    ]);
    expect(tagsUntuk("user", "hendrajit")).toEqual(["wp:users", "wp:posts"]);
  });
});

describe("slugVarian", () => {
  it("slug Latin biasa: satu varian", () => {
    expect(slugVarian("geopolitik-asia")).toEqual(["geopolitik-asia"]);
  });

  it("slug ter-persen-encode: mentah + ter-decode", () => {
    // WP mengirim post_name ter-encode; tag di lapisan fetch dibangun dari
    // param rute yang sudah di-decode — keduanya harus digugurkan.
    expect(slugVarian("%d8%b3%d9%84%d8%a7%d9%85")).toEqual([
      "%d8%b3%d9%84%d8%a7%d9%85",
      "سلام",
    ]);
  });

  it("%-sequence cacat tidak melempar — jatuh ke bentuk mentah", () => {
    expect(slugVarian("50%-benar")).toEqual(["50%-benar"]);
  });
});
