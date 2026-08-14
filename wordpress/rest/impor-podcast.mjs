/**
 * Pindahkan daftar podcast dari kode ke WordPress.
 *
 * `src/data/podcasts.ts` berisi penampilan tim GFI yang benar-benar ada —
 * bukan data contoh — dan selama ini hidup di kode karena tipe kontennya
 * belum tersedia di WordPress. Skrip ini memindahkannya ke wp-admin supaya
 * redaksi bisa menambah dan menyunting sendiri. Berkas aslinya tetap ada
 * sebagai cadangan bila WordPress tak terjangkau.
 *
 *   node --experimental-strip-types wordpress/rest/impor-podcast.mjs
 *   APPLY=1 node --experimental-strip-types wordpress/rest/impor-podcast.mjs
 *
 * Aman dijalankan berulang: slug yang sudah ada di WordPress dilewati,
 * tidak ditimpa dan tidak diduplikasi.
 */

import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { wp, TERAPKAN, judul } from "./wp.mjs";

const AKAR = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { podcasts } = await import(
  pathToFileURL(join(AKAR, "src/data/podcasts.ts")).href
);

judul(`Impor ${podcasts.length} podcast ke WordPress`);

const { data: adaDiWp } = await wp("/podcasts", {
  query: { per_page: 100, _fields: "id,slug" },
});
const sudahAda = new Set(adaDiWp.map((p) => p.slug));
console.log(`\nSudah ada di WordPress: ${adaDiWp.length}\n`);

let dibuat = 0;
let dilewati = 0;

for (const pod of podcasts) {
  if (sudahAda.has(pod.slug)) {
    console.log(`  · lewati (sudah ada)  ${pod.slug}`);
    dilewati++;
    continue;
  }

  console.log(
    `  + ${pod.tanggal}  ${pod.media.padEnd(22)} ${pod.headline.slice(0, 52)}` +
      (pod.featured ? "  [utama]" : "")
  );
  if (!TERAPKAN) continue;

  // Tanggal terbit disamakan dengan tanggal tayang aslinya supaya urutan
  // di wp-admin masuk akal, bukan menumpuk di hari impor.
  await wp("/podcasts", {
    metode: "POST",
    data: {
      title: pod.headline,
      slug: pod.slug,
      status: "publish",
      date: `${pod.tanggal}T09:00:00`,
      content: pod.ringkasan.map((p) => `<p>${p}</p>`).join("\n"),
      excerpt: pod.ringkasan[0] ?? "",
      meta: {
        tgr_kanal: pod.media,
        tgr_narasumber: pod.narasumber,
        tgr_format: pod.format,
        tgr_video_id: pod.videoId,
        tgr_tayang: pod.tanggal,
        tgr_unggulan: pod.featured ? "1" : "",
      },
    },
  });
  dibuat++;
}

if (!TERAPKAN) {
  console.log(
    "\nTinjauan selesai — tidak ada yang diubah." +
      "\nJalankan sungguhan:  APPLY=1 node --experimental-strip-types wordpress/rest/impor-podcast.mjs"
  );
} else {
  console.log(`\nSelesai. ${dibuat} dibuat, ${dilewati} dilewati.`);
  console.log(
    "Periksa di wp-admin → Podcast, lalu buka /podcast di situs untuk memastikan tampilannya."
  );
}
