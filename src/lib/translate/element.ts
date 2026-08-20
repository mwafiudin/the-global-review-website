/**
 * Jembatan widget Google Translate (element.js) — mesin yang sama dengan
 * plugin GTranslate versi gratis, dipakai langsung tanpa WordPress. Widget
 * menerjemahkan DOM di browser pembaca dan menyimpan bahasa aktifnya di
 * cookie `googtrans`; tidak ada API per string yang bisa dipanggil, jadi
 * modul ini hanya memuat bagian murni yang bisa diuji: konstanta pemasangan
 * dan urusan cookie. Orkestrasi DOM-nya ada di components/ArticleTranslate.
 *
 * Catatan risiko (diputuskan sadar): layanan element.js berstatus
 * deprecated tanpa SLA — bila kelak mati, jalur penggantinya adalah
 * terjemahan tersimpan (lihat docs/terjemahan-tersimpan-rencana.md).
 */

export const ELEMENT_CALLBACK = "tgrGoogleElementInit";

export const ELEMENT_SCRIPT_SRC = `https://translate.google.com/translate_a/element.js?cb=${ELEMENT_CALLBACK}`;

export const ELEMENT_DIV_ID = "google_translate_element_tgr";
export const ELEMENT_SCRIPT_ID = "tgr-google-element-script";
export const ELEMENT_STYLE_ID = "tgr-google-element-style";

/**
 * Menetralkan bekas visual widget: banner atas Google (menggeser body 40px),
 * placeholder widget, tooltip/balon pratinjau, dan highlight kuning pada
 * <font> yang disuntikkannya saat menerjemahkan.
 */
export const ELEMENT_STYLE = [
  `div.skiptranslate,#${ELEMENT_DIV_ID}{display:none!important}`,
  "body{top:0!important}",
  "font font{background-color:transparent!important;box-shadow:none!important;position:initial!important}",
  "#goog-gt-tt,.goog-te-balloon-frame{display:none!important}",
  ".goog-text-highlight{background:none!important;box-shadow:none!important}",
].join("\n");

/**
 * Bahasa tujuan dari cookie `googtrans` — formatnya "/sumber/tujuan"
 * (mis. "/id/en"). null bila cookie tak ada atau bentuknya tak dikenal.
 */
export function bahasaGoogtrans(cookie: string): string | null {
  const cocok = cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  if (!cocok) return null;
  return decodeURIComponent(cocok[1]).split("/")[2] || null;
}

/**
 * Nilai-nilai document.cookie untuk memusnahkan `googtrans` di semua varian
 * yang mungkin ditulis Google: tanpa domain, host persis, host berawalan
 * titik, dan domain induk (widget kadang menulis di keduanya sekaligus —
 * satu yang tersisa membuat terjemahan hidup lagi setelah reload).
 */
export function penghapusGoogtrans(hostname: string): string[] {
  const basi = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  const domain = new Set(["", hostname, `.${hostname}`]);
  const bagian = hostname.split(".");
  if (bagian.length > 2) domain.add(`.${bagian.slice(1).join(".")}`);
  return [...domain].map((d) => (d ? `${basi}; domain=${d}` : basi));
}

/** Bentuk global yang dipasang skrip Google — hanya bagian yang kita pakai. */
export type GoogleTranslateGlobal = {
  translate?: {
    TranslateElement?: new (
      opsi: {
        pageLanguage: string;
        includedLanguages?: string;
        autoDisplay?: boolean;
      },
      idElemen: string
    ) => unknown;
  };
};

declare global {
  interface Window {
    google?: GoogleTranslateGlobal;
    tgrGoogleElementInit?: () => void;
  }
}
