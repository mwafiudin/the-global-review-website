/**
 * Laporan selisih rubrik: WordPress vs peta di kode.
 *
 * Kategori baru yang dibuat redaksi tidak menimbulkan error apa pun —
 * artikelnya tetap tayang, hanya rubriknya memakai slug apa adanya dan
 * belum masuk menu. Karena senyap, satu-satunya cara menemukannya adalah
 * memeriksanya dengan sengaja. Jalankan sebelum tiap rilis.
 *
 *   node wordpress/rest/periksa-rubrik.mjs
 *
 * Hanya membaca — tidak pernah mengubah apa pun.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { wp } from "./wp.mjs";

const AKAR = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Peta dibaca sebagai teks, bukan diimpor: rubrik.ts memakai "server-only"
 * dan next/cache yang tidak bisa dimuat di luar Next.
 */
function bacaPeta() {
  const isi = readFileSync(join(AKAR, "src/lib/wp/rubrik.ts"), "utf8");
  const blok = isi.match(/const WP_TO_FE[^=]*=\s*\[([\s\S]*?)\n\];/);
  if (!blok) throw new Error("Tidak menemukan tabel WP_TO_FE di rubrik.ts");
  return [...blok[1].matchAll(/\["([^"]+)",\s*"([^"]+)"\]/g)].map((m) => ({
    wp: m[1],
    fe: m[2],
  }));
}

function bacaRubrikSitus() {
  const isi = readFileSync(join(AKAR, "src/data/site.ts"), "utf8");
  const blok = isi.match(/categoryNames: Record<string, string> = \{([\s\S]*?)\n\};/);
  if (!blok) throw new Error("Tidak menemukan categoryNames di site.ts");
  return [...blok[1].matchAll(/^\s*"?([\w/-]+)"?:\s*"/gm)].map((m) => m[1]);
}

const peta = bacaPeta();
const rubrikSitus = new Set(bacaRubrikSitus());
const { data: kategori } = await wp("/categories", {
  query: { per_page: 100, _fields: "id,slug,name,count,parent" },
});

const slugWp = new Set(kategori.map((c) => c.slug));
const slugDipeta = new Set(peta.map((p) => p.wp));

console.log(`\n═══ Selisih rubrik ═══`);
console.log(`Kategori di WordPress : ${kategori.length}`);
console.log(`Baris di peta         : ${peta.length}`);
console.log(`Rubrik di menu situs  : ${rubrikSitus.size}`);

const belumDipeta = kategori
  .filter((c) => !slugDipeta.has(c.slug))
  .sort((a, b) => b.count - a.count);
console.log(`\n── Kategori WordPress yang BELUM ada di peta (${belumDipeta.length}) ──`);
if (belumDipeta.length === 0) {
  console.log("  (tidak ada — seluruh kategori tertangani)");
} else {
  console.log("  Artikelnya tayang memakai slug apa adanya, belum masuk menu:");
  for (const c of belumDipeta) {
    console.log(`  ! ${c.slug.padEnd(28)} ${String(c.count).padStart(5)} tulisan  "${c.name}"`);
  }
}

const petaYatim = peta.filter((p) => !slugWp.has(p.wp));
console.log(`\n── Baris peta yang kategorinya sudah TIDAK ADA di WordPress (${petaYatim.length}) ──`);
if (petaYatim.length === 0) {
  console.log("  (tidak ada)");
} else {
  console.log("  Aman, tapi bisa dibersihkan dari rubrik.ts:");
  for (const p of petaYatim) console.log(`  - ${p.wp.padEnd(28)} → ${p.fe}`);
}

const tujuanTakDikenal = [...new Set(peta.map((p) => p.fe))].filter(
  (fe) => !rubrikSitus.has(fe)
);
console.log(`\n── Tujuan peta yang tidak punya label di situs (${tujuanTakDikenal.length}) ──`);
if (tujuanTakDikenal.length === 0) {
  console.log("  (tidak ada)");
} else {
  for (const fe of tujuanTakDikenal) console.log(`  ! ${fe}`);
}

const rubrikKosong = [...rubrikSitus].filter((fe) => {
  const slugCocok = peta.filter((p) => p.fe === fe || p.fe.startsWith(`${fe}/`));
  return slugCocok.every((p) => !slugWp.has(p.wp));
});
console.log(`\n── Rubrik situs yang belum punya kategori WordPress (${rubrikKosong.length}) ──`);
if (rubrikKosong.length === 0) {
  console.log("  (tidak ada)");
} else {
  console.log("  Halamannya tampil kosong sampai kategorinya dibuat:");
  for (const fe of rubrikKosong) console.log(`  ! ${fe}`);
}

const bermasalah = belumDipeta.length + tujuanTakDikenal.length;
console.log(
  bermasalah === 0
    ? "\nSemua rubrik tertangani.\n"
    : `\n${bermasalah} hal perlu ditindaklanjuti di kode.\n`
);
