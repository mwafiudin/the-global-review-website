import { describe, expect, it } from "vitest";
import { sanitizeWpHtml } from "./sanitize";

/**
 * sanitizeWpHtml adalah satu-satunya penahan stored-XSS sebelum konten WP
 * masuk dangerouslySetInnerHTML. Tes di sini mengunci allowlist-nya supaya
 * pelonggaran tak sengaja langsung ketahuan.
 */
describe("sanitizeWpHtml", () => {
  it("membuang script beserta isinya", () => {
    const out = sanitizeWpHtml('<p>Halo</p><script>alert("xss")</script>');
    expect(out).toContain("<p>Halo</p>");
    expect(out).not.toContain("script");
    expect(out).not.toContain("alert");
  });

  it("membuang event handler inline", () => {
    const out = sanitizeWpHtml('<img src="https://x.test/a.png" onerror="alert(1)">');
    expect(out).toContain("https://x.test/a.png");
    expect(out).not.toContain("onerror");
  });

  it("menolak href berskema javascript:", () => {
    const out = sanitizeWpHtml('<a href="javascript:alert(1)">klik</a>');
    expect(out).toContain("klik");
    expect(out).not.toContain("javascript:");
  });

  it("menolak gambar berskema data:", () => {
    const out = sanitizeWpHtml('<img src="data:text/html;base64,PHN2Zz4=">');
    expect(out).not.toContain("data:");
  });

  it("membuang atribut style dan class", () => {
    const out = sanitizeWpHtml('<p style="position:fixed" class="x">teks</p>');
    expect(out).toBe("<p>teks</p>");
  });

  it("meloloskan iframe YouTube", () => {
    const out = sanitizeWpHtml('<iframe src="https://www.youtube.com/embed/abc123"></iframe>');
    expect(out).toContain("https://www.youtube.com/embed/abc123");
  });

  it("membuang iframe dari host lain", () => {
    const out = sanitizeWpHtml('<iframe src="https://evil.test/frame"></iframe>');
    expect(out).not.toContain("evil.test");
  });

  it("menambahkan rel noopener pada target=_blank", () => {
    const out = sanitizeWpHtml('<a href="https://x.test" target="_blank">luar</a>');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it("menurunkan h1 di body menjadi h2", () => {
    // Halaman sudah punya satu h1 (judul artikel).
    expect(sanitizeWpHtml("<h1>Judul</h1>")).toBe("<h2>Judul</h2>");
  });

  it("membersihkan shortcode WP yang tersisa mentah", () => {
    const out = sanitizeWpHtml('<p>[caption id="attachment_1"]Keterangan[/caption]</p>');
    expect(out).toBe("<p>Keterangan</p>");
  });

  it("membersihkan shortcode plugin nonaktif (prefiks dikenal & grammar beratribut)", () => {
    expect(sanitizeWpHtml("<p>[su_button]Unduh[/su_button]</p>")).toBe(
      "<p>Unduh</p>"
    );
    expect(sanitizeWpHtml('<p>[contact-form-7 id="12" title="Kontak"]</p>')).toBe(
      "<p></p>"
    );
    expect(sanitizeWpHtml("<p>[plugin_lain id=5 gaya=besar]Isi[/plugin_lain]</p>")).toBe(
      "<p>Isi</p>"
    );
  });

  it("tidak menyapu teks berkurung yang bukan shortcode", () => {
    // Sitasi dan [sic] adalah prosa — menghapusnya merusak kutipan arsip.
    expect(sanitizeWpHtml("<p>Menurut laporan [1], kata beliau [sic] demikian.</p>")).toBe(
      "<p>Menurut laporan [1], kata beliau [sic] demikian.</p>"
    );
  });

  it("meloloskan iframe embed yang dipakai arsip (Vimeo/Spotify/SoundCloud/Maps)", () => {
    for (const src of [
      "https://player.vimeo.com/video/123",
      "https://open.spotify.com/embed/episode/abc",
      "https://w.soundcloud.com/player/?url=x",
      "https://www.google.com/maps/embed?pb=x",
    ]) {
      expect(sanitizeWpHtml(`<iframe src="${src}"></iframe>`)).toContain(src);
    }
  });

  it("membuka pembungkus blok Gutenberg agar <p> kembali anak langsung .wp-body", () => {
    // div/span dibuang tapi isinya naik level — tanpa ini `.wp-body > p`
    // (tipografi artikel) tidak mengenai paragraf di dalam wp-block-group.
    const out = sanitizeWpHtml('<div class="wp-block-group"><p>Isi</p></div>');
    expect(out).toBe("<p>Isi</p>");
  });

  it("mempertahankan class twitter-tweet pada blockquote, membuang class lain", () => {
    const out = sanitizeWpHtml(
      '<blockquote class="twitter-tweet"><p>Cuit</p></blockquote>'
    );
    expect(out).toContain('class="twitter-tweet"');
    const liar = sanitizeWpHtml('<blockquote class="menyaru-gaya-situs"><p>x</p></blockquote>');
    expect(liar).not.toContain("menyaru-gaya-situs");
  });
});
