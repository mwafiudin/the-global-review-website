import "server-only";

import sanitizeHtml from "sanitize-html";

/**
 * Sanitasi content.rendered WordPress sebelum dirender lewat
 * dangerouslySetInnerHTML. Berjalan di server saat fetch, jadi hasilnya
 * ikut ter-cache bersama halaman — nol biaya di browser.
 *
 * Ancaman yang ditangkal: stored-XSS bila akun WordPress dibobol
 * (script, event handler, iframe liar). Allowlist ketat; iframe hanya
 * YouTube karena itu satu-satunya embed yang dipakai redaksi.
 */

/** Shortcode WP yang mungkin tersisa mentah di arsip lama. */
const SHORTCODE_RE = /\[\/?(caption|gallery|embed|video|audio|playlist)[^\]]*\]/gi;

const CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "a", "strong", "b", "em", "i", "u", "s", "br", "hr",
    "blockquote", "cite", "q", "ul", "ol", "li",
    "h2", "h3", "h4",
    "figure", "figcaption", "img", "iframe",
    "table", "thead", "tbody", "tr", "th", "td",
    "sup", "sub", "code", "pre", "div", "span",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "srcset", "sizes", "alt", "width", "height", "loading"],
    iframe: ["src", "width", "height", "title", "allow", "allowfullscreen"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedIframeHostnames: [
    "www.youtube.com",
    "youtube.com",
    "www.youtube-nocookie.com",
  ],
  transformTags: {
    // Halaman sudah punya satu <h1> (judul artikel); h1 di body diturunkan.
    h1: "h2",
    a: (tagName, attribs) => {
      if ((attribs.target ?? "").toLowerCase() === "_blank") {
        attribs.rel = "noopener noreferrer";
      }
      return { tagName, attribs };
    },
  },
};

export function sanitizeWpHtml(html: string): string {
  return sanitizeHtml(html.replace(SHORTCODE_RE, ""), CONFIG).trim();
}
