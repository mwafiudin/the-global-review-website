import { describe, expect, it } from "vitest";
import { alamatKlien, dariCloudflare } from "./client-ip";

const h = (obj: Record<string, string>) => new Headers(obj);

describe("dariCloudflare", () => {
  it("mengenali rentang IPv4 dan IPv6 Cloudflare", () => {
    expect(dariCloudflare("104.16.1.1")).toBe(true);
    expect(dariCloudflare("172.71.200.9")).toBe(true);
    expect(dariCloudflare("2606:4700::1")).toBe(true);
  });

  it("menolak alamat lain dan string bukan IP", () => {
    expect(dariCloudflare("8.8.8.8")).toBe(false);
    expect(dariCloudflare("172.236.131.177")).toBe(false);
    expect(dariCloudflare("bukan-ip")).toBe(false);
    expect(dariCloudflare("")).toBe(false);
  });
});

describe("alamatKlien", () => {
  it("lewat Cloudflare: cf-connecting-ip dipakai karena peer-nya Cloudflare", () => {
    const headers = h({
      "x-forwarded-for": "203.0.113.7, 104.16.1.1",
      "cf-connecting-ip": "203.0.113.7",
    });
    expect(alamatKlien(headers)).toBe("203.0.113.7");
  });

  it("entri pertama x-forwarded-for yang dipalsukan diabaikan", () => {
    const headers = h({
      "x-forwarded-for": "10.9.8.7, 203.0.113.7, 104.16.1.1",
      "cf-connecting-ip": "203.0.113.7",
    });
    expect(alamatKlien(headers)).toBe("203.0.113.7");
  });

  it("langsung ke origin: cf-connecting-ip palsu diabaikan, peer yang dipakai", () => {
    const headers = h({
      "x-forwarded-for": "10.9.8.7, 198.51.100.4",
      "cf-connecting-ip": "1.2.3.4",
    });
    expect(alamatKlien(headers)).toBe("198.51.100.4");
  });

  it("tanpa x-forwarded-for jatuh ke x-real-ip", () => {
    expect(alamatKlien(h({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
  });

  it("null bila tidak ada header proxy atau isinya bukan IP", () => {
    expect(alamatKlien(h({}))).toBeNull();
    expect(alamatKlien(h({ "x-forwarded-for": "unknown" }))).toBeNull();
  });
});
