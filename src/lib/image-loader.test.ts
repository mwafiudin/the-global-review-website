import { describe, expect, it } from "vitest";

import { site } from "@/data/site";

import { wsrvLoader } from "./image-loader";

describe("wsrvLoader", () => {
  it("membungkus URL absolut apa adanya", () => {
    const url = wsrvLoader({
      src: "https://cms.theglobal-review.com/wp-content/uploads/2026/08/foto.jpg",
      width: 1080,
    });
    expect(url).toBe(
      "https://wsrv.nl/?url=https%3A%2F%2Fcms.theglobal-review.com%2Fwp-content%2Fuploads%2F2026%2F08%2Ffoto.jpg&w=1080&q=75&we=1&output=webp"
    );
  });

  it("memberi prefix origin situs untuk path relatif (tanpa window = URL kanonik)", () => {
    const url = wsrvLoader({ src: "/images/peta-dunia-engraving-antik.jpg", width: 640 });
    expect(url).toContain(encodeURIComponent(`${site.url}/images/peta-dunia-engraving-antik.jpg`));
  });

  it("meneruskan quality yang diminta", () => {
    expect(wsrvLoader({ src: "/a.jpg", width: 96, quality: 50 })).toContain("&q=50&");
  });

  // wsrv tidak menegosiasi format lewat header Accept: tanpa output=webp,
  // sumber PNG tetap dikirim sebagai PNG. Terukur 606 KB -> 45 KB pada satu
  // gambar situs ini, jadi hilangnya parameter ini mahal dan tak terlihat.
  it("selalu meminta keluaran WebP", () => {
    expect(wsrvLoader({ src: "/a.png", width: 640 })).toContain("&output=webp");
  });

  // SVG adalah vektor: melewatkannya ke proxy raster menukar berkas lokal
  // yang tersaji instan dengan perjalanan ke pihak ketiga — dan wordmark
  // situs ikut di-preload, jadi ini tepat di jalur kritis render pertama.
  it("melewatkan SVG apa adanya, tanpa menyentuh wsrv", () => {
    expect(wsrvLoader({ src: "/tgr-wordmark.svg", width: 3840 })).toBe(
      "/tgr-wordmark.svg"
    );
  });
});
