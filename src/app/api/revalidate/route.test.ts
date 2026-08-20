import { describe, expect, it } from "vitest";
import { tagsUntuk } from "./route";

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
});
