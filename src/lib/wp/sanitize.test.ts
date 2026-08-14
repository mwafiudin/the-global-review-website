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
});
