import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

import { site } from "@/data/site";
import { articleImage } from "@/lib/articles";
import { getArticle } from "@/lib/wp/articles";

/**
 * Kartu pratinjau bagikan, digambar sendiri untuk tiap artikel.
 *
 * Sebelumnya og:image memakai gambar unggulan apa adanya. Hasilnya tidak
 * bisa diandalkan: gambar unggulan TGR berukuran 337-1024 px dengan rasio
 * bermacam-macam, dan WhatsApp memutuskan sendiri kapan menampilkannya
 * besar atau mengecilkannya jadi kotak kecil — artikel yang satu tampil
 * megah, tetangganya tampil seperti tautan biasa. Kartu di sini selalu
 * 1200x630, apa pun bentuk sumbernya.
 *
 * Isinya hanya foto, overlay, dan logo. Judul tidak digambar ulang: WhatsApp
 * dan X sudah menampilkannya sebagai teks di bawah gambar, jadi judul di
 * dalam gambar cuma mengulang yang sudah terbaca sambil menutupi fotonya.
 *
 * Digambar dengan sharp, bukan next/og: tanpa teks tidak ada yang perlu
 * ditata satori, dan pipeline gambar murni melewatkan pemuatan font serta
 * langkah rasterisasi HTML.
 */

export const size = { width: 1200, height: 630 };
/**
 * JPEG, bukan PNG. WhatsApp menolak menampilkan gambar pratinjau di atas
 * 600 KB, dan PNG 1200x630 berisi foto menembusnya dengan mudah. Kegagalannya
 * senyap: metadata tetap sah, gambarnya saja tidak pernah muncul.
 */
export const contentType = "image/jpeg";
export const alt = "Kartu artikel The Global Review";

const NAVY_TUA = "#010F2B";
/** Jarak logo dari tepi kiri dan bawah kartu. */
const MARGIN = 56;

/** Ambang rasio foto dianggap lanskap. Di bawah ini — potret dan nyaris
 *  persegi, yaitu sampul buku dan foto tokoh yang banyak dipakai TGR —
 *  pemotongan penuh akan memakan kepala atau judul sampulnya. */
const AMBANG_LANSKAP = 1.15;

/** Logo dibaca dari berkas, bukan diunduh saat render: satu panggilan
 *  jaringan lebih sedikit di jalur yang dikejar crawler. */
async function logoEmas() {
  // Versi -dark: wordmark emas, dibuat untuk latar gelap seperti overlay ini.
  const svg = await readFile(join(process.cwd(), "public/tgr-wordmark-dark.svg"));
  const { data, info } = await sharp(svg)
    .resize({ width: 500 })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { data, tinggi: info.height };
}

/** Gradien gelap dari bawah, supaya logo tetap terbaca di atas foto apa pun —
 *  termasuk foto yang bagian bawahnya kebetulan terang. */
function overlay() {
  return Buffer.from(
    `<svg width="${size.width}" height="${size.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="${size.height}" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="${NAVY_TUA}" stop-opacity="0.95" />
          <stop offset="0.30" stop-color="${NAVY_TUA}" stop-opacity="0.55" />
          <stop offset="0.66" stop-color="${NAVY_TUA}" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect width="${size.width}" height="${size.height}" fill="url(#g)" />
    </svg>`
  );
}

/**
 * Latar kartu dari foto artikel.
 *
 * Foto lanskap dipotong memenuhi kartu. Foto potret tidak: ia ditaruh utuh
 * di tengah, dengan salinan dirinya sendiri yang diburamkan dan digelapkan
 * sebagai latar — sampul buku tetap terbaca seluruhnya, dan sisi kirinya
 * tidak berakhir sebagai balok kosong.
 */
async function latar(sumber: Buffer) {
  const { width = 0, height = 0 } = await sharp(sumber).metadata();
  const lanskap = height > 0 && width / height >= AMBANG_LANSKAP;

  if (lanskap) {
    return sharp(sumber).resize(size.width, size.height, { fit: "cover" }).toBuffer();
  }

  const [buram, utuh] = await Promise.all([
    sharp(sumber)
      .resize(size.width, size.height, { fit: "cover" })
      .blur(26)
      .modulate({ brightness: 0.5 })
      .toBuffer(),
    sharp(sumber).resize({ height: size.height, fit: "inside" }).toBuffer(),
  ]);

  return sharp(buram).composite([{ input: utuh, gravity: "center" }]).toBuffer();
}

/** Kartu tanpa foto: dipakai kalau artikel tidak punya gambar unggulan, atau
 *  kalau CMS sedang tidak bisa dihubungi. Lebih baik kartu polos bermerek
 *  daripada pratinjau yang gagal sama sekali. */
function polos() {
  return sharp({
    create: {
      width: size.width,
      height: size.height,
      channels: 3,
      background: NAVY_TUA,
    },
  })
    .png()
    .toBuffer();
}

async function ambilFoto(url: string): Promise<Buffer | null> {
  try {
    // Batas waktu wajib: crawler WhatsApp menyerah duluan kalau kartunya
    // menunggu CMS yang sedang lambat, dan pratinjau gagal itu ikut disimpan
    // di cache mereka.
    const respons = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!respons.ok) return null;
    return Buffer.from(await respons.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  const alamat = article ? articleImage(article, 1200, 800) : null;
  const sumber = alamat
    ? await ambilFoto(alamat.startsWith("http") ? alamat : site.url + alamat)
    : null;

  const dasar = sumber ? await latar(sumber) : await polos();
  const logo = await logoEmas();

  const jpeg = await sharp(dasar)
    .composite([
      { input: overlay(), top: 0, left: 0 },
      { input: logo.data, top: size.height - MARGIN - logo.tinggi, left: MARGIN },
    ])
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": contentType,
      // Kartu hanya berubah bila artikelnya disunting, dan penyuntingan
      // sudah memicu revalidasi lewat webhook — jadi aman disimpan lama.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
