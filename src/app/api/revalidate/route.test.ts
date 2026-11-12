import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag }));

const { POST, profilUntuk, slugVarian, tagsUntuk } = await import("./route");

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

describe("profilUntuk", () => {
  it("tulisan terbit: daftar dan detail memakai max (salinan lama tetap tersaji)", () => {
    expect(profilUntuk("wp:posts", "publish")).toBe("max");
    expect(profilUntuk("wp:post:a", "publish")).toBe("max");
  });

  it("tulisan ditarik: hanya detailnya yang hilang seketika", () => {
    for (const status of ["draft", "trash", "private", "pending"]) {
      expect(profilUntuk("wp:post:a", status)).toEqual({ expire: 0 });
      expect(profilUntuk("wp:posts", status)).toBe("max");
    }
  });

  it("koleksi, peta, dan laman tidak pernah dibuang seketika", () => {
    for (const tag of ["wp:podcasts", "wp:categories", "wp:users", "wp:halaman"]) {
      expect(profilUntuk(tag, "trash")).toBe("max");
    }
  });
});

describe("POST", () => {
  const SECRET = "rahasia-uji";
  const asli = process.env.REVALIDATE_SECRET;

  beforeEach(() => {
    process.env.REVALIDATE_SECRET = SECRET;
    revalidateTag.mockClear();
  });
  afterEach(() => {
    process.env.REVALIDATE_SECRET = asli;
  });

  function kirim(body: unknown, secret = SECRET) {
    return POST(
      new Request("http://x/api/revalidate", {
        method: "POST",
        headers: { "x-tgr-secret": secret, "content-type": "application/json" },
        body: JSON.stringify(body),
      }) as unknown as NextRequest
    );
  }

  it("regresi 11 Nov 2026: webhook terbit tidak membuang cache daftar", async () => {
    const res = await kirim({ type: "post", slug: "a", status_new: "publish" });
    expect(res.status).toBe(200);
    expect(revalidateTag.mock.calls).toEqual([
      ["wp:post:a", "max"],
      ["wp:posts", "max"],
    ]);
  });

  it("tulisan dibuang ke trash: detail gugur seketika, daftar tetap max", async () => {
    await kirim({ type: "post", slug: "a", status_new: "trash" });
    expect(revalidateTag.mock.calls).toEqual([
      ["wp:post:a", { expire: 0 }],
      ["wp:posts", "max"],
    ]);
  });

  it("payload tanpa status_new (kiriman lama) dianggap terbit", async () => {
    await kirim({ type: "post", slug: "a" });
    expect(revalidateTag.mock.calls.every(([, p]) => p === "max")).toBe(true);
  });

  it("rahasia salah: 401 dan tidak ada yang digugurkan", async () => {
    const res = await kirim({ type: "post", slug: "a" }, "salah");
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
