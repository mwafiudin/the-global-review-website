#!/usr/bin/env node
/**
 * Membuat seluruh berkas ikon situs dari satu sumber: public/tgr-gold-compass.svg.
 *
 * Sengaja digenerate, bukan digambar ulang per ukuran — kalau logo berubah,
 * cukup ganti SVG-nya lalu `npm run ikon`, dan semua turunannya ikut benar.
 *
 * Yang dihasilkan:
 *   src/app/icon.svg          tab peramban modern (skalabel)
 *   src/app/favicon.ico       peramban lama + hasil pencarian (16/32/48)
 *   src/app/apple-icon.png    layar utama iOS/iPadOS — wajib PNG buram
 *   public/tgr-ikon-*.png     Android/PWA lewat manifest
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const AKAR = join(dirname(fileURLToPath(import.meta.url)), "..");
const SUMBER = join(AKAR, "public", "tgr-gold-compass.svg");

/** Navy logotype (huruf "THE GLOBAL REVIEW" pada tgr-logo.svg). */
const NAVY = "#012258";
const SISI = 512;

/**
 * iOS memotong sudut ikon dengan masker sendiri, jadi ikon Apple dibuat
 * persegi penuh tanpa transparansi — sudut membulat yang dibakar ke gambar
 * akan tampak tercukil, dan area transparan dirender hitam.
 */
const RADIUS = 88;

/** Kompas dipasang lebih kecil pada varian yang sudutnya dipotong platform. */
async function tile({ skala, radius }) {
  const isi = await readFile(SUMBER, "utf8");
  const [, w, h] = isi.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);
  const dalam = isi.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

  const lebar = SISI * skala;
  const tinggi = (lebar * h) / w;
  const x = (SISI - lebar) / 2;
  const y = (SISI - tinggi) / 2;
  const sudut = radius ? ` rx="${radius}" ry="${radius}"` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${SISI}" height="${SISI}" viewBox="0 0 ${SISI} ${SISI}">
<rect width="${SISI}" height="${SISI}"${sudut} fill="${NAVY}"/>
<svg x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${lebar.toFixed(1)}" height="${tinggi.toFixed(1)}" viewBox="0 0 ${w} ${h}">
${dalam.trim()}
</svg>
</svg>
`;
}

const png = (svg, sisi) =>
  sharp(Buffer.from(svg)).resize(sisi, sisi).png({ compressionLevel: 9 }).toBuffer();

/**
 * ICO = header + daftar entri + isi. Sejak Windows Vista tiap entri boleh
 * berupa PNG utuh, jadi tidak perlu encoder BMP terpisah maupun dependensi
 * tambahan.
 */
function ico(gambar) {
  const kepala = Buffer.alloc(6);
  kepala.writeUInt16LE(0, 0); // reserved
  kepala.writeUInt16LE(1, 2); // 1 = ikon
  kepala.writeUInt16LE(gambar.length, 4);

  let offset = 6 + gambar.length * 16;
  const entri = gambar.map(({ sisi, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(sisi >= 256 ? 0 : sisi, 0); // 0 berarti 256
    e.writeUInt8(sisi >= 256 ? 0 : sisi, 1);
    e.writeUInt8(0, 2); // jumlah warna palet
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // color planes
    e.writeUInt16LE(32, 6); // bit per piksel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });

  return Buffer.concat([kepala, ...entri, ...gambar.map((g) => g.data)]);
}

const app = (nama) => join(AKAR, "src", "app", nama);
const publik = (nama) => join(AKAR, "public", nama);

async function main() {
  const membulat = await tile({ skala: 0.72, radius: RADIUS });
  const penuh = await tile({ skala: 0.68, radius: 0 });
  // Android memangkas ikon maskable hingga lingkaran dalam 80%; markanya
  // harus muat di zona aman itu, bukan sekadar diperkecil sedikit.
  const maskable = await tile({ skala: 0.52, radius: 0 });

  await mkdir(publik(""), { recursive: true });
  await writeFile(app("icon.svg"), membulat);

  // Pada 16 px cincin kompas menipis sampai hilang; entri terkecil memakai
  // marka yang lebih rapat supaya tetap terbaca. Itu memang gunanya ICO
  // menyimpan beberapa ukuran sekaligus.
  const rapat = await tile({ skala: 0.88, radius: RADIUS });
  const isiIco = await Promise.all(
    [16, 32, 48].map(async (sisi) => ({
      sisi,
      data: await png(sisi === 16 ? rapat : membulat, sisi),
    }))
  );
  await writeFile(app("favicon.ico"), ico(isiIco));

  await writeFile(app("apple-icon.png"), await png(penuh, 180));
  await writeFile(publik("tgr-ikon-192.png"), await png(membulat, 192));
  await writeFile(publik("tgr-ikon-512.png"), await png(membulat, 512));
  await writeFile(publik("tgr-ikon-maskable-512.png"), await png(maskable, 512));

  console.log("ikon dibuat dari", SUMBER.replace(AKAR, "."));
}

await main();
