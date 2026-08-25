/**
 * Teks WordPress → teks polos: strip tag + decode entity, tanpa DOM.
 *
 * Terpisah dari map.ts karena map.ts memuat `server-only`, sedangkan fungsi
 * di sini murni dan perlu dipakai juga oleh perkakas Node di
 * `wordpress/rest/`. Menyalin ulang logikanya di sana berarti dua versi yang
 * bisa menyimpang — dan hasilnya dibandingkan persis dengan judul yang
 * dirender, jadi selisih satu karakter pun berakibat.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  nbsp: " ", hellip: "…", ndash: "–", mdash: "—",
  ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’",
  laquo: "«", raquo: "»", deg: "°", middot: "·",
};

/** Codepoint liar (surrogate/di luar rentang) tidak boleh meruntuhkan halaman. */
function safeCodePoint(n: number): string {
  try {
    return String.fromCodePoint(n);
  } catch {
    return "";
  }
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => safeCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
}

function stripTags(html: string): string {
  return (
    html
      // Tag yang menempel tanda baca tidak boleh menyisipkan spasi:
      // "…<a>laporan</a>." dulu menjadi "laporan ." dan bocor sampai meta
      // description. Hanya posisi bersinggungan langsung yang dirapatkan —
      // spasi sah di dalam teks ("Rupiah ’26") tidak tersentuh.
      .replace(/<[^>]+>(?=[.,;:!?…%)\]}»”’])/g, "")
      .replace(/(?<=[(\[{«“‘])<[^>]+>/g, "")
      .replace(/<[^>]+>/g, " ")
  );
}

/** HTML → teks polos rapi (untuk judul, excerpt, hitung kata). */
export function cleanText(html: string): string {
  return decodeEntities(stripTags(html)).replace(/\s+/g, " ").trim();
}

/** Buang artefak excerpt WordPress: "[…]", "[...]", "&hellip;" di ujung. */
export function cleanExcerpt(html: string): string {
  return cleanText(html)
    .replace(/\s*\[\s*(…|\.{3})\s*\]\s*$/u, "…")
    .trim();
}

/** HTML → daftar paragraf teks polos (pemisah </p>). */
export function htmlParagraphs(html: string): string[] {
  return html
    .split(/<\/p>/i)
    .map((chunk) => cleanText(chunk))
    .filter(Boolean);
}
