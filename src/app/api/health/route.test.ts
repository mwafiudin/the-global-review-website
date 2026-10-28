import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, dynamic } from "./route";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/health", () => {
  it("200 dengan JSON { ok: true } saja", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/^application\/json/);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("tidak boleh di-cache Cloudflare, Caddy, maupun Next", () => {
    expect(GET().headers.get("cache-control")).toBe("no-store");
    // Route handler Next 16 memang dinamis secara bawaan, tapi GET tanpa
    // data runtime ini kandidat sempurna untuk di-prerender bila aturan
    // cache diubah kelak. Jawaban statis = health check selalu hijau walau
    // proses sudah macet.
    expect(dynamic).toBe("force-dynamic");
  });

  it("tidak memanggil fetch (WordPress lambat tidak boleh menjatuhkannya)", async () => {
    const fetchPalsu = vi.fn(() => Promise.reject(new Error("WP mati")));
    vi.stubGlobal("fetch", fetchPalsu);
    const res = GET();
    expect(res.status).toBe(200);
    await res.json();
    expect(fetchPalsu).not.toHaveBeenCalled();
  });
});
