import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";

import { site } from "@/data/site";
import { articleImage, categoryName, formatDate } from "@/lib/articles";
import { gambarBagikan } from "@/lib/seo";
import { getArticle } from "@/lib/wp/articles";

/**
 * Kartu pratinjau bagikan, digambar sendiri untuk tiap artikel.
 *
 * Sebelumnya og:image memakai gambar unggulan apa adanya. Hasilnya tidak
 * bisa diandalkan: gambar unggulan TGR berukuran 337-1024 px dengan rasio
 * bermacam-macam, dan WhatsApp memutuskan sendiri kapan menampilkannya
 * besar atau mengecilkannya jadi kotak kecil — artikel yang satu tampil
 * megah, tetangganya tampil seperti tautan biasa.
 *
 * Kartu yang digambar di sini selalu 1200x630, apa pun bentuk sumbernya.
 * Judulnya ikut terbaca di dalam gambar, dan itu yang paling menentukan
 * orang berhenti menggulir di grup WhatsApp — bukan sekadar gambar besar.
 *
 * Tata letak panel samping dipilih, bukan foto penuh bergradasi: gambar
 * unggulan TGR banyak yang potret (sampul buku, foto tokoh), dan foto
 * potret yang dipaksa memenuhi kartu lanskap akan terpotong di wajah.
 * Dengan panel, foto berbentuk apa pun tetap utuh proporsinya dan teks
 * tidak pernah menumpang di atasnya.
 */

export const size = { width: 1200, height: 630 };
/**
 * JPEG, bukan PNG bawaan ImageResponse.
 *
 * WhatsApp menolak menampilkan gambar pratinjau di atas 600 KB, dan PNG
 * 1200x630 berisi foto menembusnya dengan mudah — kartu pertama yang diuji
 * 613 KB. Kegagalannya senyap: metadata tetap sah, gambarnya saja tidak
 * pernah muncul. JPEG memotongnya jauh di bawah ambang tanpa perbedaan
 * yang kasat mata pada kartu seukuran ini.
 */
export const contentType = "image/jpeg";
export const alt = "Kartu artikel The Global Review";

const NAVY = "#011840";
const NAVY_TUA = "#010F2B";
const EMAS = "#D9B14A";
const KERTAS = "#F5F3EE";

/** Font dibaca dari berkas, bukan diunduh saat render: satu panggilan
 *  jaringan lebih sedikit di jalur yang dikejar crawler. */
async function muatFont(nama: string) {
  return readFile(join(process.cwd(), "src/app/fonts", nama));
}

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const article = await getArticle(slug);

  const [cardo, montserrat] = await Promise.all([
    muatFont("cardo-bold.woff"),
    muatFont("montserrat-semibold.woff"),
  ]);

  const bahasa = lang === "en" ? "en" : "id";
  const judul = article?.title ?? site.name;
  const rubrik = article ? categoryName(article.category) : site.tagline;
  const tanggal = article ? formatDate(article.date, bahasa) : "";

  // Lewat domain sendiri, bukan cms.* langsung: gambar jadi satu asal
  // dengan halamannya dan tidak ikut mati saat CMS bermasalah.
  const foto = article
    ? gambarBagikan(articleImage(article, 700, 900), site.url)
    : null;

  // Judul panjang diperkecil supaya tetap muat tanpa terpotong. Ambangnya
  // dari jumlah huruf, bukan kata: judul TGR banyak memuat istilah panjang
  // ("Neo Kolonialisme", "Interkonektivitas") yang satu kata pun sudah
  // memakan satu baris.
  const ukuranJudul = judul.length > 96 ? 38 : judul.length > 62 ? 44 : 54;

  // Lebar panel dihitung eksplisit, bukan diserahkan ke flexGrow: perender
  // kartu tidak membungkus teks di dalam kotak yang lebarnya belum pasti —
  // judul panjang akan melenggang keluar tepi dan terpotong begitu saja.
  const LEBAR_FOTO = 462;
  const lebarPanel = foto ? size.width - LEBAR_FOTO : size.width;

  const kartu = new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: NAVY,
        }}
      >
        {foto ? (
          <div
            style={{
              display: "flex",
              width: LEBAR_FOTO,
              height: size.height,
              background: NAVY_TUA,
            }}
          >
            <img
              src={foto}
              alt=""
              width={LEBAR_FOTO}
              height={size.height}
              style={{
                width: LEBAR_FOTO,
                height: size.height,
                objectFit: "cover",
              }}
            />
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: lebarPanel,
            height: size.height,
            justifyContent: "space-between",
            padding: foto ? "54px 52px 44px" : "72px 80px 60px",
            borderLeft: foto ? `1px solid rgba(217,177,74,0.28)` : "none",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Montserrat",
                fontSize: 20,
                letterSpacing: 3.4,
                textTransform: "uppercase",
                color: EMAS,
              }}
            >
              {rubrik}
            </div>
            <div
              style={{
                display: "flex",
                width: "100%",
                marginTop: 20,
                fontFamily: "Cardo",
                fontSize: ukuranJudul,
                lineHeight: 1.2,
                color: KERTAS,
              }}
            >
              {judul}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `1px solid rgba(217,177,74,0.28)`,
              paddingTop: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Cardo",
                fontSize: 24,
                letterSpacing: 2.2,
                whiteSpace: "nowrap",
                color: EMAS,
              }}
            >
              THE GLOBAL REVIEW
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Montserrat",
                fontSize: 16,
                whiteSpace: "nowrap",
                color: "rgba(245,243,238,0.62)",
              }}
            >
              {tanggal}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Cardo", data: cardo, style: "normal", weight: 700 },
        { name: "Montserrat", data: montserrat, style: "normal", weight: 600 },
      ],
    }
  );

  const jpeg = await sharp(Buffer.from(await kartu.arrayBuffer()))
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
