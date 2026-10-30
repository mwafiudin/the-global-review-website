import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { kodeSebab } from "./client";

describe("kodeSebab", () => {
  it("mengambil kode dari err.cause undici", () => {
    const err = new TypeError("fetch failed", {
      cause: Object.assign(new Error("Connect Timeout Error"), {
        code: "UND_ERR_CONNECT_TIMEOUT",
      }),
    });
    expect(kodeSebab(err)).toBe(" [UND_ERR_CONNECT_TIMEOUT]");
  });

  it("jatuh ke pesan cause bila tak ada kode", () => {
    const err = new TypeError("fetch failed", { cause: new Error("other side closed") });
    expect(kodeSebab(err)).toBe(" [other side closed]");
  });

  it("kosong untuk galat tanpa cause atau bukan Error", () => {
    expect(kodeSebab(new Error("x"))).toBe("");
    expect(kodeSebab("x")).toBe("");
  });
});

/** Yang dilempar undici saat SYN tidak dibalas (firewall host men-DROP IP kita). */
function connectTimeout(): TypeError {
  return new TypeError("fetch failed", {
    cause: Object.assign(new Error("Connect Timeout Error"), {
      code: "UND_ERR_CONNECT_TIMEOUT",
    }),
  });
}

function connectReset(): TypeError {
  return new TypeError("fetch failed", {
    cause: Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" }),
  });
}

const ok = () => new Response("[]", { status: 200 });

/** Fetch yang menggantung sampai tes menjawab atau menggagalkannya. */
function fetchMenggantung() {
  const tertunda: Array<{ jawab: (res: Response) => void; gagal: (err: unknown) => void }> = [];
  const fn = vi.fn(
    () =>
      new Promise<Response>((jawab, gagal) => tertunda.push({ jawab, gagal }))
  );
  return { fn, tertunda };
}

// Semafor dan pemutus disimpan di level modul: tiap tes memuat salinan baru
// supaya keadaan tes sebelumnya tidak terbawa.
async function klienBaru() {
  vi.resetModules();
  return import("./client");
}

describe("request ke WordPress saat host tak terjangkau", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv("WP_API_URL", "https://wp.contoh/wp-json");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("tidak mengulang permintaan yang gagal karena timeout", async () => {
    const fetchPalsu = vi.fn().mockRejectedValue(connectTimeout());
    vi.stubGlobal("fetch", fetchPalsu);
    const { wpFetchFresh } = await klienBaru();

    await expect(wpFetchFresh("/posts")).rejects.toThrow(/UND_ERR_CONNECT_TIMEOUT/);
    expect(fetchPalsu).toHaveBeenCalledTimes(1);
  });

  it("timeout AbortSignal juga tidak diulang", async () => {
    const fetchPalsu = vi
      .fn()
      .mockRejectedValue(new DOMException("The operation was aborted due to timeout", "TimeoutError"));
    vi.stubGlobal("fetch", fetchPalsu);
    const { wpFetch } = await klienBaru();

    await expect(wpFetch("/posts", { revalidate: 60, tags: [] })).rejects.toThrow(
      /tidak menjawab dalam batas waktu/
    );
    expect(fetchPalsu).toHaveBeenCalledTimes(1);
  });

  it("tetap mengulang sekali untuk galat cepat dan 5xx", async () => {
    const fetchPalsu = vi
      .fn()
      .mockRejectedValueOnce(connectReset())
      .mockResolvedValueOnce(ok());
    vi.stubGlobal("fetch", fetchPalsu);
    const { wpFetchFresh } = await klienBaru();

    const pertama = wpFetchFresh("/posts");
    await vi.advanceTimersByTimeAsync(700);
    await expect(pertama).resolves.toEqual([]);
    expect(fetchPalsu).toHaveBeenCalledTimes(2);

    fetchPalsu
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(ok());
    const kedua = wpFetchFresh("/posts");
    await vi.advanceTimersByTimeAsync(700);
    await expect(kedua).resolves.toEqual([]);
    expect(fetchPalsu).toHaveBeenCalledTimes(4);
  });

  it("menolak tanpa menyentuh jaringan setelah empat galat transport beruntun", async () => {
    const fetchPalsu = vi.fn().mockRejectedValue(connectTimeout());
    vi.stubGlobal("fetch", fetchPalsu);
    const { wpFetch, wpFetchFresh } = await klienBaru();

    for (let i = 0; i < 4; i++) {
      await expect(wpFetchFresh("/posts")).rejects.toThrow(/UND_ERR_CONNECT_TIMEOUT/);
    }
    await expect(wpFetchFresh("/categories")).rejects.toThrow(/pemutus terbuka/);
    await expect(wpFetch("/posts", { revalidate: 60, tags: [] })).rejects.toThrow(
      /pemutus terbuka/
    );
    expect(fetchPalsu).toHaveBeenCalledTimes(4);
  });

  it("satu sukses di antaranya menolkan hitungan galat", async () => {
    const fetchPalsu = vi.fn().mockRejectedValue(connectTimeout());
    vi.stubGlobal("fetch", fetchPalsu);
    const { wpFetchFresh } = await klienBaru();

    for (let i = 0; i < 3; i++) await expect(wpFetchFresh("/a")).rejects.toThrow();
    fetchPalsu.mockResolvedValueOnce(ok());
    await expect(wpFetchFresh("/b")).resolves.toEqual([]);
    for (let i = 0; i < 3; i++) {
      await expect(wpFetchFresh("/c")).rejects.toThrow(/UND_ERR_CONNECT_TIMEOUT/);
    }
    expect(fetchPalsu).toHaveBeenCalledTimes(7);
  });

  it("4xx dan 5xx bukan tanda tak terjangkau: host menjawab", async () => {
    const fetchPalsu = vi.fn(async () => new Response("", { status: 404 }));
    vi.stubGlobal("fetch", fetchPalsu);
    const { wpFetchFresh } = await klienBaru();

    for (let i = 0; i < 6; i++) {
      await expect(wpFetchFresh("/posts")).rejects.toThrow(/WP menjawab 404/);
    }
    expect(fetchPalsu).toHaveBeenCalledTimes(6);
  });

  it("setelah jeda hanya satu permintaan uji yang lewat; sukses menutup pemutus", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(connectTimeout()));
    const { wpFetchFresh } = await klienBaru();
    for (let i = 0; i < 4; i++) await expect(wpFetchFresh("/a")).rejects.toThrow();

    await vi.advanceTimersByTimeAsync(30_000);
    const gantung = fetchMenggantung();
    vi.stubGlobal("fetch", gantung.fn);

    const uji = wpFetchFresh("/uji");
    await vi.advanceTimersByTimeAsync(0);
    await expect(wpFetchFresh("/lain")).rejects.toThrow(/pemutus terbuka/);
    expect(gantung.fn).toHaveBeenCalledTimes(1);

    gantung.tertunda[0].jawab(ok());
    await expect(uji).resolves.toEqual([]);
    vi.stubGlobal("fetch", vi.fn(async () => ok()));
    await expect(wpFetchFresh("/lain")).resolves.toEqual([]);
  });

  it("uji yang gagal membuka pemutus lagi untuk satu jeda penuh", async () => {
    const fetchPalsu = vi.fn().mockRejectedValue(connectTimeout());
    vi.stubGlobal("fetch", fetchPalsu);
    const { wpFetchFresh } = await klienBaru();
    for (let i = 0; i < 4; i++) await expect(wpFetchFresh("/a")).rejects.toThrow();

    await vi.advanceTimersByTimeAsync(30_000);
    await expect(wpFetchFresh("/uji")).rejects.toThrow(/UND_ERR_CONNECT_TIMEOUT/);
    expect(fetchPalsu).toHaveBeenCalledTimes(5);

    await vi.advanceTimersByTimeAsync(29_000);
    await expect(wpFetchFresh("/a")).rejects.toThrow(/pemutus terbuka/);
    expect(fetchPalsu).toHaveBeenCalledTimes(5);

    await vi.advanceTimersByTimeAsync(1_000);
    await expect(wpFetchFresh("/uji-lagi")).rejects.toThrow(/UND_ERR_CONNECT_TIMEOUT/);
    expect(fetchPalsu).toHaveBeenCalledTimes(6);
  });

  it("permintaan yang terlanjur mengantre gagal cepat begitu pemutus terbuka", async () => {
    const gantung = fetchMenggantung();
    vi.stubGlobal("fetch", gantung.fn);
    const { wpFetchFresh } = await klienBaru();

    const slot = Array.from({ length: 4 }, (_, i) => wpFetchFresh(`/slot${i}`));
    for (const p of slot) p.catch(() => {});
    const antre = wpFetchFresh("/antre");
    const tertolak = expect(antre).rejects.toThrow(/pemutus terbuka/);
    await vi.advanceTimersByTimeAsync(0);
    expect(gantung.fn).toHaveBeenCalledTimes(4);

    for (const t of gantung.tertunda) t.gagal(connectTimeout());
    await tertolak;
    expect(gantung.fn).toHaveBeenCalledTimes(4);
  });

  it("antrean slot berbatas waktu, bukan sampai platform memutus di menit ke-5", async () => {
    const gantung = fetchMenggantung();
    vi.stubGlobal("fetch", gantung.fn);
    const { wpFetchFresh } = await klienBaru();

    for (let i = 0; i < 4; i++) wpFetchFresh(`/slot${i}`).catch(() => {});
    const antre = wpFetchFresh("/antre");
    const tertolak = expect(antre).rejects.toThrow(/antrean/);
    await vi.advanceTimersByTimeAsync(9_999);
    expect(gantung.fn).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(1);
    await tertolak;

    // Yang menyerah dikeluarkan dari antrean: slot yang dilepas sesudahnya
    // mengalir ke permintaan berikutnya, bukan ke penunggu yang sudah pergi.
    const berikut = wpFetchFresh("/berikut");
    await vi.advanceTimersByTimeAsync(0);
    gantung.tertunda[0].jawab(ok());
    await vi.advanceTimersByTimeAsync(0);
    expect(gantung.fn).toHaveBeenCalledTimes(5);
    gantung.tertunda[4].jawab(ok());
    await expect(berikut).resolves.toEqual([]);
  });
});
