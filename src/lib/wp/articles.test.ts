import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Batas arsip dibaca sekali saat modul dimuat, jadi tiap kasus mengimpor
 * ulang modulnya setelah menyetel env.
 */
async function muat(nilai?: string) {
  vi.resetModules();
  if (nilai === undefined) vi.unstubAllEnvs();
  else vi.stubEnv("WP_ARCHIVE_AFTER", nilai);
  return import("./articles");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("withArchive", () => {
  it("menyisipkan batas arsip pada kueri daftar biasa", async () => {
    const { withArchive } = await muat("2022-12-31T23:59:59");
    expect(withArchive({ categories: "6" })).toEqual({
      after: "2022-12-31T23:59:59",
      categories: "6",
    });
  });

  it("tidak menimpa `after` milik pemanggil (jangkar prev/next)", async () => {
    const { withArchive } = await muat("2022-12-31T23:59:59");
    expect(withArchive({ after: "2026-08-13T08:59:16", order: "asc" })).toEqual({
      after: "2026-08-13T08:59:16",
      order: "asc",
    });
  });

  it("melewatkan rujukan eksplisit berdasarkan slug", async () => {
    const { withArchive } = await muat("2022-12-31T23:59:59");
    expect(withArchive({ slug: "artikel-2019" })).toEqual({
      slug: "artikel-2019",
    });
  });

  it("WP_ARCHIVE_AFTER kosong menayangkan seluruh arsip", async () => {
    const { withArchive } = await muat("");
    expect(withArchive({ categories: "6" })).toEqual({ categories: "6" });
  });
});

describe("mediaIdsTanpaGambar", () => {
  const pos = (over: Record<string, unknown>) => ({
    id: 1,
    slug: "x",
    date: "2026-08-25T08:00:00",
    author: 1,
    title: { rendered: "X" },
    ...over,
  });

  it("pos ber-tgr_gambar tidak ikut batch /media", async () => {
    const { mediaIdsTanpaGambar } = await muat();
    expect(
      mediaIdsTanpaGambar([
        pos({ featured_media: 11, tgr_gambar: "https://cms.x/a.jpg" }),
        pos({ featured_media: 12 }),
      ] as never)
    ).toEqual([12]);
  });

  it("field null/absen (mu-plugin lama) tetap di-resolve lewat batch", async () => {
    const { mediaIdsTanpaGambar } = await muat();
    expect(
      mediaIdsTanpaGambar([
        pos({ featured_media: 11, tgr_gambar: null }),
        pos({ featured_media: 12, tgr_gambar: "" }),
      ] as never)
    ).toEqual([11, 12]);
  });

  it("pos tanpa gambar unggulan menghasilkan 0 (disaring wpFetchByIdsFresh)", async () => {
    const { mediaIdsTanpaGambar } = await muat();
    expect(mediaIdsTanpaGambar([pos({})] as never)).toEqual([0]);
  });
});

describe("slugSah", () => {
  it("menerima bentuk slug WordPress", async () => {
    const { slugSah } = await muat();
    for (const slug of [
      "polarisasi-blok-indo-pasifik",
      "uni-eropa-diminta-tidak-ikuti-permainan-trump-2",
      "a",
      "judul_lama",
      "سلام",
      "%d8%b3%d9%84%d8%a7%d9%85",
      "a".repeat(200),
    ]) {
      expect(slugSah(slug), slug).toBe(true);
    }
  });

  it("menolak tebakan pemindai dan bentuk yang mustahil", async () => {
    const { slugSah } = await muat();
    // Diambil dari log 8 Nov 2026 (TLM-Audit-Scanner) dan batas pola.
    for (const slug of [
      "web.config",
      "config.xml",
      ".env",
      "php.ini",
      "phpinfo.php",
      "docker-compose.yml",
      "laravel.log",
      "[slug]",
      "*",
      "..\\..\\var",
      "a/b",
      "a b",
      "a<script>",
      "a?b=1",
      "50%-benar",
      "%2e%2e%2f",
      "",
      "a".repeat(201),
    ]) {
      expect(slugSah(slug), slug).toBe(false);
    }
  });
});

describe("getArticle", () => {
  it("regresi 8 Nov 2026: slug mustahil tidak pernah sampai ke WordPress", async () => {
    vi.stubEnv("WP_API_URL", "https://wp.contoh/wp-json");
    const fetchPalsu = vi.fn();
    vi.stubGlobal("fetch", fetchPalsu);
    vi.resetModules();
    const { getArticle } = await import("./articles");
    for (const slug of ["web.config", ".env", "phpinfo.php", "[slug]"]) {
      expect(await getArticle(slug)).toBeUndefined();
    }
    expect(fetchPalsu).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("slug wajar tetap ditanyakan ke WordPress", async () => {
    vi.stubEnv("WP_API_URL", "https://wp.contoh/wp-json");
    const fetchPalsu = vi.fn<(url: unknown) => Promise<Response>>(async () => Response.json([]));
    vi.stubGlobal("fetch", fetchPalsu);
    vi.resetModules();
    const { getArticle } = await import("./articles");
    expect(await getArticle("judul-yang-belum-ada")).toBeUndefined();
    expect(fetchPalsu).toHaveBeenCalledTimes(1);
    expect(String(fetchPalsu.mock.calls[0][0])).toContain("slug=judul-yang-belum-ada");
    vi.unstubAllGlobals();
  });
});
