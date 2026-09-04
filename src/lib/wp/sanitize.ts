import "server-only";

import sanitizeHtml from "sanitize-html";

/**
 * Sanitasi content.rendered WordPress sebelum dirender lewat
 * dangerouslySetInnerHTML. Berjalan di server saat fetch, jadi hasilnya
 * ikut ter-cache bersama halaman — nol biaya di browser.
 *
 * Ancaman yang ditangkal: stored-XSS bila akun WordPress dibobol
 * (script, event handler, iframe liar). Allowlist ketat; iframe dibatasi
 * pada host embed yang benar-benar muncul di arsip (YouTube, Vimeo,
 * Spotify, SoundCloud, Google Maps, Facebook) — sebelumnya YouTube saja
 * dan embed lain lenyap dari badan artikel tanpa jejak.
 */

/**
 * Shortcode WP yang tersisa mentah di arsip lama (plugin sumbernya sudah
 * nonaktif, jadi WordPress merender teks kurungnya apa adanya). Tiga pola,
 * sengaja TIDAK menyapu semua teks berkurung — "[sic]" dan sitasi "[1]"
 * bukan shortcode:
 *   1. nama inti/prefiks plugin yang dikenal, dengan/tanpa atribut;
 *   2. token beratribut key=value — grammar shortcode, bukan prosa;
 *   3. token penutup [/nama] — pasangan pola 1–2.
 */
const SHORTCODE_RE = new RegExp(
  [
    String.raw`\[\/?(?:caption|gallery|embed|video|audio|playlist|contact-form-7|su_[\w-]+|vc_[\w-]+|et_pb_[\w-]+|fusion_[\w-]+|rev_slider[\w-]*)(?:\s[^\]]*)?\]`,
    String.raw`\[[a-z][\w-]*(?:\s+[\w-]+=(?:"[^"\]]*"|'[^'\]]*'|[^\s\]]+))+\s*\/?\]`,
    String.raw`\[\/[a-z][\w-]*\]`,
  ].join("|"),
  "gi"
);

const CONFIG: sanitizeHtml.IOptions = {
  // div/span sengaja TIDAK diizinkan: sanitize-html membuang tag-nya tapi
  // mempertahankan isinya, sehingga <p> di dalam pembungkus blok Gutenberg
  // (<div class="wp-block-group">) naik menjadi anak langsung .wp-body dan
  // tetap terkena tipografi `.wp-body > p` di globals.css.
  allowedTags: [
    "p", "a", "strong", "b", "em", "i", "u", "s", "br", "hr",
    "blockquote", "cite", "q", "ul", "ol", "li",
    "h2", "h3", "h4",
    "figure", "figcaption", "img", "iframe",
    "table", "thead", "tbody", "tr", "th", "td",
    "sup", "sub", "code", "pre",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "srcset", "sizes", "alt", "width", "height", "loading"],
    iframe: ["src", "width", "height", "title", "allow", "allowfullscreen"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
    blockquote: ["cite"],
  },
  // Embed X/Twitter tiba sebagai <blockquote class="twitter-tweet"> +
  // script (script-nya tetap ditolak). Hanya class itu yang lolos — class
  // liar lain tetap dibuang agar konten tak bisa meminjam gaya situs.
  allowedClasses: {
    blockquote: ["twitter-tweet"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedIframeHostnames: [
    "www.youtube.com",
    "youtube.com",
    "www.youtube-nocookie.com",
    "player.vimeo.com",
    "open.spotify.com",
    "w.soundcloud.com",
    "www.google.com",
    "maps.google.com",
    "www.facebook.com",
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
    /**
     * Gambar sisipan dialihkan lewat wsrv.
     *
     * Gambar unggulan dan sidebar melewati ImageWithFallback dan karenanya
     * ikut ter-cache CDN; gambar DI DALAM badan artikel datang sebagai HTML
     * mentah dari WordPress dan selama ini menembak cms.* langsung — tanpa
     * cadangan, tanpa cache. Saat CMS mati (dua kali pada 3 September 2026),
     * hanya gambar sisipan yang patah, dan patahnya tampil sebagai ikon
     * rusak di tengah tulisan.
     *
     * srcset dan sizes DIBUANG, bukan ikut ditulis ulang: keduanya menunjuk
     * cms.* dan peramban mendahulukannya di atas src — memperbaiki src saja
     * tidak mengubah apa pun. we=1 mencegah pembesaran melebihi berkas
     * aslinya, jadi satu URL sudah memadai.
     */
    img: (tagName, attribs) => {
      const src = attribs.src ?? "";
      if (!/^https?:\/\//.test(src)) {
        return { tagName, attribs };
      }
      const { srcset, sizes, ...sisa } = attribs;
      void srcset;
      void sizes;
      return {
        tagName,
        attribs: {
          ...sisa,
          src: `https://wsrv.nl/?url=${encodeURIComponent(
            src
          )}&w=1200&q=80&we=1&output=webp`,
          loading: attribs.loading ?? "lazy",
        },
      };
    },
  },
};

export function sanitizeWpHtml(html: string): string {
  return sanitizeHtml(html.replace(SHORTCODE_RE, ""), CONFIG).trim();
}
