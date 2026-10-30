import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Koleksi kecil (podcast, ulasan buku, album) dibaca utuh lalu dicari per
 * slug. Saat WordPress gagal dibaca, halaman daftar boleh tampil kosong,
 * tapi halaman detail tidak boleh menjawab 404: crawler mencatat halaman
 * yang ada sebagai hilang (29 Okt 2026: 191 404 palsu dalam enam jam).
 */

// Di luar Next tidak ada incremental cache; yang diuji di sini perilaku
// galatnya, bukan cache-nya.
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const connectTimeout = () =>
  new TypeError("fetch failed", {
    cause: Object.assign(new Error("Connect Timeout Error"), {
      code: "UND_ERR_CONNECT_TIMEOUT",
    }),
  });

describe("detail koleksi saat WordPress gagal dibaca", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("WP_API_URL", "https://wp.contoh/wp-json");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(connectTimeout()));
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("podcast: daftar kosong, detail melempar", async () => {
    const { wpPodcast, wpPodcasts } = await import("./podcasts");
    await expect(wpPodcasts()).resolves.toEqual([]);
    await expect(wpPodcast("rasil-tv-gejolak-geopolitik-dunia")).rejects.toThrow(
      /UND_ERR_CONNECT_TIMEOUT/
    );
  });

  it("bedah buku: daftar kosong, detail melempar", async () => {
    const { wpBook, wpBooks } = await import("./books");
    await expect(wpBooks()).resolves.toEqual([]);
    await expect(wpBook("tangan-tangan-amerika")).rejects.toThrow(/UND_ERR_CONNECT_TIMEOUT/);
  });

  it("galeri: daftar kosong, detail melempar", async () => {
    const { wpAlbum, wpAlbums } = await import("./gallery");
    await expect(wpAlbums()).resolves.toEqual([]);
    await expect(wpAlbum("album-apa-saja")).rejects.toThrow(/UND_ERR_CONNECT_TIMEOUT/);
  });

  it("slug yang memang tidak ada tetap undefined (jadi 404) saat WP sehat", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("[]", { status: 200, headers: { "x-wp-total": "0" } }))
    );
    const { wpPodcast } = await import("./podcasts");
    const { wpAlbum } = await import("./gallery");
    await expect(wpPodcast("tidak-ada")).resolves.toBeUndefined();
    await expect(wpAlbum("tidak-ada")).resolves.toBeUndefined();
  });
});
