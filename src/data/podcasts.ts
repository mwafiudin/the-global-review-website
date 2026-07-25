export interface Podcast {
  slug: string;
  /** Headline yang ditulis redaksi TGR untuk penampilan ini. */
  headline: string;
  /** Nama kanal/media pengunggah (pemilik konten). */
  media: string;
  /** Narasumber dari tim GFI. */
  narasumber: string;
  /** Format acara, mis. "Talkshow", "Podcast", "Bedah Buku". */
  format: string;
  tanggal: string; // ISO, tanggal tayang asli di YouTube
  videoId: string;
  /** Ringkasan/artikel singkat, tiap elemen satu paragraf. */
  ringkasan: string[];
  featured?: boolean;
}

export const podcasts: Podcast[] = [
  {
    slug: "jaya-suprana-show-perang-asimetris",
    headline:
      "Di Jaya Suprana Show, Hendrajit Bedah Perang Asimetris sebagai Sarana Nir-Militer Imperialisme Gaya Baru",
    media: "Jaya Suprana Show",
    narasumber: "Hendrajit",
    format: "Talkshow",
    tanggal: "2024-01-17",
    videoId: "XSTDZI3vKDc",
    featured: true,
    ringkasan: [
      "Direktur Eksekutif Global Future Institute, Hendrajit, hadir sebagai narasumber dalam Jaya Suprana Show untuk membahas tesis utamanya: penjajahan di abad ke-21 tidak lagi dijalankan lewat pendudukan militer, melainkan melalui perang asimetris yang menyasar kesadaran, ekonomi, dan tata kelola sebuah bangsa.",
      "Dalam obrolan bersama Jaya Suprana itu, Hendrajit menjelaskan bagaimana instrumen nir-militer, mulai dari penetrasi ideologi, rekayasa opini publik, hingga ketergantungan teknologi, dipakai untuk melumpuhkan daya tahan sebuah negara tanpa satu peluru pun ditembakkan.",
      "Perbincangan ini merupakan salah satu penjelasan paling ringkas dan mudah dicerna dari kerangka berpikir yang ia tuangkan dalam buku Perang Asimetris & Skema Penjajahan Gaya Baru.",
    ],
  },
  {
    slug: "tribrata-tv-bedah-buku-perang-asimetris",
    headline:
      "TRIBRATA TV Bedah Buku 'Perang Asimetris & Skema Penjajahan Gaya Baru'",
    media: "TRIBRATA TV",
    narasumber: "Hendrajit",
    format: "Bedah Buku",
    tanggal: "2017-05-26",
    videoId: "EjxuyekfeMI",
    ringkasan: [
      "TRIBRATA TV menggelar bedah buku Perang Asimetris & Skema Penjajahan Gaya Baru bersama penulisnya, Hendrajit, dalam sebuah diskusi yang menyoroti relevansi konsep perang asimetris bagi keamanan nasional Indonesia.",
      "Diskusi ini mempertemukan perspektif jurnalistik-geopolitik GFI dengan kalangan yang menaruh perhatian pada isu pertahanan, membuka ruang tanya jawab tentang bagaimana ancaman nir-militer bekerja di lapangan.",
    ],
  },
  {
    slug: "aktual-polemik-freeport",
    headline:
      "Polemik Freeport: 'Perkawinan Siri Antara Korporasi dan Kleptokrasi'",
    media: "Aktual Video News",
    narasumber: "Hendrajit",
    format: "Wawancara",
    tanggal: "2015-11-23",
    videoId: "Jt1SVQd2aFU",
    ringkasan: [
      "Dalam wawancara bersama Aktual, Hendrajit membedah polemik Freeport dengan diksi yang khas: apa yang ia sebut sebagai 'perkawinan siri' antara kepentingan korporasi global dan praktik kleptokrasi di dalam negeri.",
      "Ia menempatkan sengketa tambang itu bukan sekadar soal kontrak ekonomi, melainkan sebagai medan pertarungan kedaulatan atas sumber daya strategis nasional.",
    ],
  },
  {
    slug: "rasil-tv-gejolak-geopolitik-dunia",
    headline:
      "Rasil TV: Gejolak Geopolitik Dunia dan Peluang Perang Dunia Ketiga",
    media: "Rasil TV",
    narasumber: "Hendrajit",
    format: "Talkshow",
    tanggal: "2022-08-05",
    videoId: "CX0xvdmBAsY",
    ringkasan: [
      "Bersama Rasil TV, Hendrajit memetakan gejolak geopolitik global mutakhir, dari perang Rusia-Ukraina hingga pergeseran poros kekuatan, serta menakar seberapa nyata peluang eskalasi menuju konflik berskala dunia.",
      "Ia menekankan posisi Indonesia yang berada di titik silang kepentingan adidaya, dan mengapa politik luar negeri bebas-aktif justru semakin relevan di tengah dunia yang kian multipolar.",
    ],
  },
  {
    slug: "armory-reborn-militerisasi-eropa",
    headline: "Militerisasi Eropa: Konsekuensi Pasca-Invasi Rusia ke Ukraina",
    media: "Armory Reborn",
    narasumber: "Hendrajit",
    format: "Podcast",
    tanggal: "2025-03-24",
    videoId: "Et4G6Un7xSM",
    ringkasan: [
      "Kanal Armory Reborn membahas gelombang militerisasi Eropa bersama Hendrajit, menyusul invasi Rusia ke Ukraina yang mengubah arsitektur keamanan kawasan secara mendasar.",
      "Perbincangan menyoroti bagaimana peningkatan belanja pertahanan dan penguatan NATO berdampak pada keseimbangan global, serta implikasinya bagi kawasan Asia Pasifik.",
    ],
  },
  {
    slug: "soedadang-mapmi-bumn-kedaulatan-ekonomi",
    headline:
      "MAPMI: Hendrajit dan Gagasan Mengembalikan BUMN ke Jalan Kedaulatan Ekonomi",
    media: "SoeDADANG Merdesa",
    narasumber: "Hendrajit",
    format: "Diskusi",
    tanggal: "2018-09-26",
    videoId: "K9lNpVhhaNc",
    ringkasan: [
      "Dalam forum yang diunggah kanal SoeDADANG Merdesa, Hendrajit mengangkat gagasan mengembalikan peran BUMN sebagai instrumen kedaulatan ekonomi nasional, bukan sekadar entitas bisnis yang tunduk pada logika pasar bebas.",
      "Ia menautkan persoalan tata kelola BUMN dengan tema besar kemandirian bangsa, sejalan dengan gagasan #BangsaMerdesa yang menjadi tajuk diskusi tersebut.",
    ],
  },
  {
    slug: "rasil-tv-babak-baru-arab-spring-2",
    headline: "Babak Baru Arab Spring (Bagian 2) bersama Hendrajit",
    media: "Rasil TV",
    narasumber: "Hendrajit",
    format: "Talkshow",
    tanggal: "2018-04-29",
    videoId: "RFpbBM-kH6w",
    ringkasan: [
      "Melanjutkan serial diskusinya di Rasil TV, Hendrajit mengurai babak baru gejolak Timur Tengah pasca Arab Spring: bagaimana revolusi yang dijanjikan berujung pada instabilitas berkepanjangan di sejumlah negara.",
      "Ia menyoroti peran kepentingan asing dan perebutan sumber daya di balik dinamika kawasan, sebuah studi kasus nyata dari mekanisme perang asimetris.",
    ],
  },
  {
    slug: "rasil-tv-babak-baru-arab-spring-3",
    headline: "Babak Baru Arab Spring (Bagian 3) bersama Hendrajit",
    media: "Rasil TV",
    narasumber: "Hendrajit",
    format: "Talkshow",
    tanggal: "2018-04-29",
    videoId: "zxHA8K4FELA",
    ringkasan: [
      "Pada bagian ketiga diskusi di Rasil TV, Hendrajit menutup rangkaian pembahasan Arab Spring dengan menarik pelajaran bagi Indonesia dalam menjaga stabilitas dan kedaulatan di tengah tekanan geopolitik global.",
      "Ia menegaskan pentingnya membaca pola: bahwa krisis di satu kawasan kerap menjadi cermin bagi skenario serupa yang bisa menyasar kawasan lain.",
    ],
  },
  {
    slug: "hmi-karawang-pandemi-perang-asimetris",
    headline:
      "Pandemi Covid-19 dalam Perspektif Perang Asimetris",
    media: "HMI Cabang Karawang",
    narasumber: "Hendrajit",
    format: "Diskusi",
    tanggal: "2020-04-10",
    videoId: "aFpLzw-EeYs",
    ringkasan: [
      "Bersama HMI Cabang Karawang, Hendrajit menawarkan pembacaan alternatif atas pandemi Covid-19: bukan semata krisis kesehatan, melainkan momentum yang mengubah tatanan geopolitik dan ekonomi global.",
      "Ia mengajak peserta melihat bagaimana disrupsi berskala global dapat dimanfaatkan sebagai instrumen tekanan antarnegara, sekaligus menegaskan pentingnya ketahanan nasional yang mandiri.",
    ],
  },
];

export function getPodcast(slug: string): Podcast | undefined {
  return podcasts.find((p) => p.slug === slug);
}

export function allPodcasts(): Podcast[] {
  return [...podcasts].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}
