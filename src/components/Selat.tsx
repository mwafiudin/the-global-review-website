"use client";

import { useEffect } from "react";
import {
  ELEMENT_DIV_ID,
  ELEMENT_SCRIPT_ID,
  ELEMENT_SCRIPT_SRC,
  ELEMENT_STYLE,
  ELEMENT_STYLE_ID,
  penghapusGoogtrans,
} from "@/lib/translate/element";

/**
 * Selat — jembatan bahasa otomatis pohon /en. Dinamai selat karena
 * menghubungkan dua daratan bahasa, sebagaimana selat menghubungkan dua
 * daratan — dan bagi media geopolitik, selat adalah titik strategis.
 *
 * Dipasang di root layout hanya saat lang === "en"; saklar ID/EN di menu
 * dengan sendirinya menjadi kendali tunggal: pindah ke /en berarti Selat
 * ikut termuat dan menerjemahkan sisa konten Indonesia (isi artikel) di
 * browser pembaca lewat widget Google element.js — tanpa tombol terpisah.
 * Kembali ke ID = dokumen asli dari server, tanpa widget sama sekali.
 *
 * Mekanisme (hasil bedah plugin GTranslate): suntik skrip element.js +
 * div tersembunyi, lalu dorong <select class="goog-te-combo"> milik Google
 * ke "en"; Google menulis-ulang text node halaman dan terus menerjemahkan
 * konten baru lewat MutationObserver internalnya (navigasi client-side
 * ikut tertangani). Komponen interaktif dilindungi atribut translate="no"
 * masing-masing. Gagal memuat = halaman tetap tampil apa adanya (chrome
 * sudah Inggris dari kamus; artikel tinggal berbahasa Indonesia).
 */

// Pengawal berdetak murah selama ±2 menit pertama: dorong widget hanya bila
// belum ada bukti sapuan. Jeda antar dorongan sengaja panjang — tiap event
// change memulai ulang sapuan Google, dan halaman berat butuh beberapa detik;
// mendorong terlalu rapat membuat sapuan tak pernah selesai, sementara
// dorongan yang berhenti terlalu cepat kalah oleh hidrasi yang telat
// (teramati: sapuan dini hanya mengenai sebagian konten).
const JEDA_DETAK_MS = 2500;
const MAKS_DETAK = 48;
const DETAK_ANTAR_DORONG = 3;

/**
 * Bukti terjemahan sungguhan: <font> suntikan Google di area konten.
 * Kelas translated-* pada <html> saja tidak cukup — widget bisa memasangnya
 * tanpa menyapu satu node pun (keadaan macet saat cookie sudah ada di init).
 */
function terjemahanNyata(): boolean {
  return document.querySelector("main font") !== null;
}

export function Selat() {
  useEffect(() => {
    let timer: number | null = null;

    function pasangInfra() {
      // Idempoten; layout tidak remount antar rute /en, jadi praktis
      // berjalan sekali per muat dokumen.
      if (!document.getElementById(ELEMENT_STYLE_ID)) {
        const gaya = document.createElement("style");
        gaya.id = ELEMENT_STYLE_ID;
        gaya.textContent = ELEMENT_STYLE;
        document.head.appendChild(gaya);
      }
      if (!document.getElementById(ELEMENT_DIV_ID)) {
        const wadah = document.createElement("div");
        wadah.id = ELEMENT_DIV_ID;
        document.body.appendChild(wadah);
      }
      window.tgrGoogleElementInit = () => {
        const Elemen = window.google?.translate?.TranslateElement;
        if (Elemen)
          new Elemen(
            { pageLanguage: "id", includedLanguages: "en", autoDisplay: false },
            ELEMENT_DIV_ID
          );
      };
      if (!document.getElementById(ELEMENT_SCRIPT_ID)) {
        const skrip = document.createElement("script");
        skrip.id = ELEMENT_SCRIPT_ID;
        skrip.src = ELEMENT_SCRIPT_SRC;
        document.body.appendChild(skrip);
      } else if (!document.querySelector("select.goog-te-combo")) {
        window.tgrGoogleElementInit();
      }
    }

    function mulai() {
      // Mulai selalu dari keadaan bersih: cookie googtrans sisa kunjungan
      // sebelumnya membuat init widget macet (lihat penghapusGoogtrans).
      for (const resep of penghapusGoogtrans(window.location.hostname)) {
        document.cookie = resep;
      }
      pasangInfra();
      // Dorong combo tersembunyi Google ke "en" (change dua kali persis cara
      // GTranslate memicunya) lalu kawal hasilnya: bila sapuan belum/tidak
      // mengenai konten — atau hasilnya tersapu balik oleh render React —
      // dorong lagi, berjarak, sampai jendela pengawalan habis. Menyerah
      // diam-diam bila skrip Google tak kunjung hidup atau layanannya
      // menolak (offline/terblokir/throttle).
      let detakKe = 0;
      let dorongTerakhir = -DETAK_ANTAR_DORONG;
      timer = window.setInterval(() => {
        detakKe++;
        if (detakKe > MAKS_DETAK) {
          if (timer !== null) window.clearInterval(timer);
          timer = null;
          return;
        }
        if (terjemahanNyata()) return;
        const combo = document.querySelector<HTMLSelectElement>(
          "select.goog-te-combo"
        );
        if (!combo) return;
        if (detakKe - dorongTerakhir < DETAK_ANTAR_DORONG) return;
        dorongTerakhir = detakKe;
        combo.value = "en";
        combo.dispatchEvent(new Event("change"));
        combo.dispatchEvent(new Event("change"));
      }, JEDA_DETAK_MS);
    }

    // Tunggu dokumen tuntas dimuat — mendorong saat konten masih
    // mengalir membuat bagian yang datang belakangan lolos terjemahan.
    if (document.readyState === "complete") mulai();
    else window.addEventListener("load", mulai, { once: true });

    return () => {
      window.removeEventListener("load", mulai);
      if (timer !== null) window.clearInterval(timer);
    };
  }, []);

  return null;
}
