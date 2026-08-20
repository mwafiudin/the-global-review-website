/**
 * Fondasi Selat — jembatan widget Google Translate (element.js), mesin yang
 * sama dengan plugin GTranslate versi gratis, dipakai langsung tanpa
 * WordPress. Widget menerjemahkan DOM di browser pembaca; tidak ada API per
 * string yang bisa dipanggil, jadi modul ini hanya memuat konstanta
 * pemasangan yang bisa diuji. Orkestrasinya ada di components/Selat.
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
 * Nilai-nilai document.cookie untuk memusnahkan `googtrans` di semua varian
 * yang mungkin ditulis Google: tanpa domain, host persis, host berawalan
 * titik, dan domain induk. Wajib dijalankan SEBELUM skrip Google dimuat —
 * bila cookie sudah ada saat init, widget kadang macet "merasa sudah
 * menerjemahkan" tanpa menyapu satu node pun, dan dorongan combo bernilai
 * sama tidak menyembuhkannya (diamati langsung saat verifikasi).
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
