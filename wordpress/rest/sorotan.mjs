/**
 * Isi meta `tgr_sorotan` — frasa judul yang diberi coretan penanda di situs.
 *
 *   node --experimental-strip-types wordpress/rest/sorotan.mjs
 *   APPLY=1 node --experimental-strip-types wordpress/rest/sorotan.mjs
 *   TIMPA=1 …   ikut menimpa nilai yang sudah ada (bawaan: dilewati)
 *
 * Efeknya sudah ada di frontend sejak prototype, tetapi metanya kosong di
 * seluruh tulisan WordPress sehingga tidak pernah tampil sekali pun. Skrip
 * ini mengisi nilai awal yang masuk akal; redaksi tetap bisa menggantinya
 * per tulisan lewat kotak "Sorotan Judul" di layar edit.
 *
 * Aman dijalankan berulang: nilai yang sudah sama dan yang sudah diisi
 * tangan dilewati, jadi kegagalan di tengah jalan cukup dijalankan ulang.
 */

import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { wp, TERAPKAN, judul, berkelompok } from "./wp.mjs";

const AKAR = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { cleanText } = await import(
  pathToFileURL(join(AKAR, "src", "lib", "wp", "text.ts")).href
);

const TIMPA = process.env.TIMPA === "1";
const ARSIP_SETELAH = "2022-12-31T23:59:59";

/* ── Cara frasa dipilih ────────────────────────────────────────────────
 *
 * Percobaan pertama memakai kapitalisasi sebagai penanda nama diri —
 * dan gagal: sebagian besar judul di sini ditulis Title Case, sehingga
 * huruf besar tidak membedakan "Asia Pasifik" dari "Memantik".
 *
 * Yang membedakan justru pengulangan. Istilah kunci sebuah media muncul
 * berkali-kali di seluruh judulnya ("Asia Pasifik" 32x, "Timur Tengah"
 * 12x, "Laut Cina Selatan" 5x), sedangkan kata kerja seperti "Memantik"
 * muncul sekali. Jadi kamusnya digali dari korpus judul itu sendiri, bukan
 * ditulis tangan — ikut tumbuh sendiri seiring tulisan baru terbit.
 *
 * Yang tersisa untuk dikurasi hanya kata umum yang kebetulan juga sering
 * muncul; daftarnya pendek dan tidak akan bertambah panjang.
 */

const PERANGKAI = new Set(
  ("di ke dari dan atau yang untuk dengan pada dalam antara bagi oleh serta " +
    "tanpa tetapi namun adalah ialah itu ini ada akan juga saja lebih masih " +
    "sudah belum tidak bukan agar supaya karena sebab hingga sampai bila jika " +
    "saat ketika setelah sebelum selama demi tentang seperti sebagai menuju " +
    "melalui terhadap kepada harus dapat bisa boleh ala " +
    "vs the of in and for on at by with a an is to").split(" ")
);

/** Sering muncul, tapi bukan konsep — penanda di sini akan terasa asal. */
const UMUM = new Set(
  ("baru bagian balik kembali tak sama tetap menjadi perlu memicu berpotensi " +
    "isu besar gaya pasca tahun era kini nanti lagi sangat hanya banyak " +
    "seluruh setiap semua para kaum soal hal cara jalan arah wajah babak " +
    "catatan mengapa kenapa bagaimana apakah benarkah saatnya " +
    "membaca menulis melihat memahami mencari menyoal menimbang menakar " +
    "meninjau menelaah mengurai membedah menyoroti " +
    "semakin makin kian hampir selalu terus mulai justru bahkan pula " +
    "masih sekadar sungguh benar-benar begitu demikian mana bag habis jilid").split(" ")
);

/**
 * Kata kerja ber-awalan me- yang panjang. Dipakai hanya untuk menolak kata
 * TERAKHIR sebuah frasa: "Iran Mengguncang" dan "Asia Tenggara Meningkat"
 * berhenti di tengah kalimat, bukan di ujung sebuah konsep. Ambang delapan
 * huruf sengaja dipasang agar kata benda pendek yang berawalan sama
 * (Menteri, Menara, Merdeka) tidak ikut tersapu.
 */
const kataKerja = (inti) => /^me(?:ng|ny|m|n|l|r)?\p{Ll}/u.test(inti) && inti.length >= 8;

const layakKata = (inti) =>
  Boolean(inti) &&
  /^\p{Lu}/u.test(inti) &&
  /^[\p{L}\p{N}][\p{L}\p{N}-]*$/u.test(inti) &&
  !PERANGKAI.has(inti.toLowerCase()) &&
  !UMUM.has(inti.toLowerCase()) &&
  (inti.length >= 3 || akronim(inti));

const akronim = (inti) =>
  inti.length >= 3 && inti === inti.toUpperCase() && /\p{L}/u.test(inti);

/**
 * Judul → deretan kata layak yang benar-benar bersebelahan.
 *
 * Pemisahnya wajib satu spasi: tanpa syarat ini frasa bisa melompati koma
 * atau titik dua dan menghasilkan potongan seperti "FPN: Indonesia Harus".
 */
function deretan(judulBersih) {
  const hasil = [];
  let jalan = [];
  const re = /\S+/g;
  let m;
  let ujungSebelumnya = -1;
  let posisi = 0;

  while ((m = re.exec(judulBersih)) !== null) {
    const mentah = m[0];
    const depan = mentah.match(/^[^\p{L}\p{N}]*/u)[0].length;
    const inti = mentah.slice(depan).replace(/[^\p{L}\p{N}-]+$/u, "");
    const mulai = m.index + depan;
    const akhir = mulai + inti.length;

    const bersambung = ujungSebelumnya >= 0 && mulai === ujungSebelumnya + 1;
    // Kata pertama judul ikut dipertimbangkan, kecuali ia pembuka generik —
    // itu sudah tersaring lewat UMUM.
    if (layakKata(inti) && (bersambung || jalan.length === 0)) {
      jalan.push({ inti, mulai, akhir, posisi });
    } else {
      if (jalan.length) hasil.push(jalan);
      jalan = layakKata(inti) ? [{ inti, mulai, akhir, posisi }] : [];
    }
    ujungSebelumnya = akhir;
    posisi++;
  }
  if (jalan.length) hasil.push(jalan);
  return hasil;
}

/** Hitung berapa kali tiap kata & frasa muncul di seluruh judul. */
export function bangunKamus(judulSemua) {
  const kata = new Map();
  const frasa = new Map();
  const tambah = (peta, k) => peta.set(k, (peta.get(k) || 0) + 1);

  for (const judulBersih of judulSemua) {
    for (const deret of deretan(judulBersih)) {
      deret.forEach((t) => {
        // Kata pertama judul dilewati: di Title Case ia selalu berkapital,
        // jadi menghitungnya hanya menaikkan kata umum.
        if (t.posisi > 0) tambah(kata, t.inti);
      });
      for (let n = 2; n <= 3; n++) {
        for (let i = 0; i + n <= deret.length; i++) {
          tambah(frasa, deret.slice(i, i + n).map((t) => t.inti).join(" "));
        }
      }
    }
  }
  return { kata, frasa };
}

export function pilihSorotan(judulBersih, kamus) {
  if (judulBersih.split(/\s+/).length < 4) return "";

  const kandidat = [];
  for (const deret of deretan(judulBersih)) {
    for (let n = 1; n <= 3; n++) {
      for (let i = 0; i + n <= deret.length; i++) {
        const potong = deret.slice(i, i + n);
        const teks = judulBersih.slice(potong[0].mulai, potong[n - 1].akhir);
        const kataFreq = potong.map((t) => kamus.kata.get(t.inti) ?? 0);
        const frasaFreq = n > 1 ? kamus.frasa.get(potong.map((t) => t.inti).join(" ")) ?? 0 : 0;

        // Frasa tiga kata hanya lolos bila memang pernah muncul utuh:
        // tanpa syarat itu, dua konsep bertetangga bisa tergabung jadi
        // satu potongan ngawur ("Piala [Dunia Amerika Serikat] 2026").
        //
        // Satu kata hanya diterima bila berupa akronim lembaga (NATO,
        // BRICS, OPCW). Aturan berbasis panjang sempat dicoba dan meloloskan
        // kata kerja panjang seperti "Terselubung"; aturan berbasis
        // frekuensi meloloskan kata seperti "Indonesia" yang justru tidak
        // menerangkan apa pun. Akronim tidak punya dua masalah itu.
        const lolos =
          n === 3
            ? frasaFreq >= 2
            : n === 2
              ? frasaFreq >= 2 || Math.min(...kataFreq) >= 8
              : akronim(potong[0].inti);
        if (!lolos) continue;
        if (n > 1 && kataKerja(potong[n - 1].inti)) continue;

        kandidat.push({
          teks,
          nilai: n * 1000 + frasaFreq * 20 + Math.min(...kataFreq),
        });
      }
    }
  }

  const bersih = kandidat.filter((k) => {
    // Frasa yang muncul dua kali memotong judul: komponen frontend memakai
    // split() dan hanya memakai dua bagian pertama.
    if (judulBersih.split(k.teks).length !== 2) return false;
    // Penanda yang menutupi sebagian besar judul berhenti jadi penanda.
    return k.teks.length / judulBersih.length <= 0.55;
  });

  if (!bersih.length) return "";
  bersih.sort((a, b) => b.nilai - a.nilai || a.teks.length - b.teks.length);
  return bersih[0].teks;
}

/* ── Jalankan ──────────────────────────────────────────────────────── */

async function ambilSemua() {
  const semua = [];
  for (let page = 1; page <= 15; page++) {
    const { data } = await wp("/posts", {
      query: {
        per_page: 100,
        page,
        status: "publish",
        after: ARSIP_SETELAH,
        orderby: "date",
        order: "desc",
        _fields: "id,title,meta",
      },
    });
    semua.push(...data);
    if (data.length < 100) break;
  }
  return semua;
}

judul("Sorotan judul");

const semua = await ambilSemua();
const bersih = semua.map((p) => ({ ...p, judul: cleanText(p.title.rendered) }));
const kamus = bangunKamus(bersih.map((p) => p.judul));

const rencana = [];
let terlewat = 0;
let kosong = 0;

for (const pos of bersih) {
  const sekarang = pos.meta?.tgr_sorotan ?? "";
  if (sekarang && !TIMPA) {
    terlewat++;
    continue;
  }
  const frasa = pilihSorotan(pos.judul, kamus);
  if (!frasa) {
    kosong++;
    continue;
  }
  if (frasa === sekarang) continue;
  rencana.push({ id: pos.id, judul: pos.judul, frasa });
}

console.log(`kosakata terkumpul     : ${kamus.kata.size} kata, ${kamus.frasa.size} frasa`);
console.log(`tulisan tayang 2023+   : ${semua.length}`);
console.log(`sudah terisi, dilewati : ${terlewat}`);
console.log(`tanpa frasa yang layak : ${kosong}`);
console.log(`akan diisi             : ${rencana.length}\n`);

// CONTOH=1000 untuk memeriksa seluruh usulan, bukan cuma pucuknya.
const contoh = Number(process.env.CONTOH ?? 30);
for (const r of rencana.slice(0, contoh)) {
  console.log(`  ${r.judul.replace(r.frasa, `[${r.frasa}]`)}`);
}
if (rencana.length > contoh) console.log(`  … dan ${rencana.length - contoh} lainnya`);

if (!TERAPKAN) {
  console.log("\nMode tinjauan. Jalankan ulang dengan APPLY=1 untuk menerapkan.");
  process.exit(0);
}

const gagal = [];
await berkelompok(
  rencana,
  async (r) => {
    try {
      await wp(`/posts/${r.id}`, { metode: "POST", data: { meta: { tgr_sorotan: r.frasa } } });
    } catch (err) {
      gagal.push({ id: r.id, pesan: err.message });
      throw err;
    }
  },
  { label: "sorotan" }
);

console.log(`\nselesai: ${rencana.length - gagal.length} terisi, ${gagal.length} gagal`);
for (const g of gagal.slice(0, 10)) console.log(`  gagal ${g.id}: ${g.pesan}`);
if (gagal.length) console.log("Jalankan ulang skrip ini — yang sudah terisi dilewati.");
