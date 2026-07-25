export interface Book {
  slug: string;
  judul: string;
  penulis: string;
  penerbit: string;
  tahun: string;
  cover: string;
  /** Ringkasan pendek untuk kartu daftar. */
  ringkasan: string;
  /** Ulasan lengkap, tiap elemen satu paragraf. */
  ulasan: string[];
  /** Slug podcast/video terkait (opsional) untuk embed di halaman ulasan. */
  podcastTerkait?: string;
}

const PLACEHOLDER = "/images/placeholder-sampul-buku.jpg";

export const books: Book[] = [
  {
    slug: "perang-asimetris-skema-penjajahan-gaya-baru",
    judul: "Perang Asimetris & Skema Penjajahan Gaya Baru",
    penulis: "Hendrajit",
    penerbit: "Global Future Institute",
    tahun: "2019",
    cover: "/images/buku-perang-asimetris-skema-penjajahan-gaya-baru.jpg",
    podcastTerkait: "tribrata-tv-bedah-buku-perang-asimetris",
    ringkasan:
      "Mengurai bagaimana penaklukan di era modern bekerja tanpa kekuatan militer: melalui penetrasi ideologi, penguasaan ekonomi, dan perang informasi.",
    ulasan: [
      "Buku ini berangkat dari satu pertanyaan yang mengganggu: mengapa sebuah bangsa bisa kehilangan kedaulatannya tanpa pernah benar-benar dikalahkan dalam peperangan? Hendrajit menjawabnya dengan konsep perang asimetris, sebuah bentuk penaklukan yang tidak lagi mengandalkan tank dan meriam, melainkan penetrasi ke ruang-ruang yang paling lunak dari sebuah negara: kesadaran publik, kebijakan ekonomi, dan tata kelola informasi.",
      "Dengan latar pengalamannya sebagai jurnalis sekaligus pengkaji geopolitik, penulis menautkan teori dengan sejumlah studi kasus konkret. Ia menunjukkan bagaimana rekayasa opini, ketergantungan teknologi, dan liberalisasi yang dipaksakan dapat menjadi instrumen penjajahan gaya baru yang jauh lebih sulit dideteksi ketimbang kolonialisme klasik.",
      "Bagian paling kuat dari buku ini adalah ajakannya untuk membaca ulang posisi Indonesia. Alih-alih berhenti pada kecemasan, Hendrajit menawarkan kerangka bagaimana sebuah bangsa bisa membangun daya tahan, mulai dari kemandirian ekonomi hingga literasi geopolitik warga.",
      "Tidak mengherankan bila buku ini menjadi rujukan di berbagai lembaga pendidikan pertahanan di Indonesia. Ditulis dengan bahasa yang lugas namun tetap analitis, ia berhasil menerjemahkan konsep yang rumit menjadi bacaan yang relevan bagi siapa pun yang peduli pada masa depan kedaulatan nasional.",
    ],
  },
  {
    slug: "tangan-tangan-amerika",
    judul: "Tangan-Tangan Amerika: Operasi Siluman AS di Pelbagai Belahan Dunia",
    penulis: "Hendrajit",
    penerbit: "Global Future Institute",
    tahun: "2010",
    cover: PLACEHOLDER,
    ringkasan:
      "Menelusuri jejak operasi-operasi terselubung Amerika Serikat di berbagai kawasan dunia dan pelajaran yang bisa dipetik Indonesia.",
    ulasan: [
      "Melalui buku ini, Hendrajit menyusun sebuah peta panjang tentang bagaimana Amerika Serikat menjalankan pengaruhnya lewat operasi-operasi yang jarang terlihat di permukaan. Dari dukungan diam-diam pada kelompok tertentu hingga rekayasa krisis, penulis memperlihatkan pola yang berulang di banyak kawasan.",
      "Yang membedakan buku ini dari sekadar kumpulan teori konspirasi adalah upaya penulis menautkan setiap kasus dengan kepentingan geopolitik yang lebih besar. Ia mengajak pembaca melihat bahwa intervensi tersembunyi selalu punya logika: penguasaan sumber daya, jalur strategis, atau pembendungan kekuatan pesaing.",
      "Bagi pembaca Indonesia, nilai buku ini terletak pada refleksinya. Hendrajit tidak berhenti pada kritik terhadap kekuatan asing, tetapi menegaskan pentingnya kewaspadaan dan kemandirian dalam merumuskan politik luar negeri yang benar-benar berpijak pada kepentingan nasional.",
    ],
  },
  {
    slug: "japanese-militarism-war-crimes-asia-pacific",
    judul: "Japanese Militarism & Its War Crimes in Asia Pacific Region",
    penulis: "Hendrajit",
    penerbit: "Global Future Institute",
    tahun: "2011",
    cover: PLACEHOLDER,
    ringkasan:
      "Kajian sejarah militerisme Jepang dan kejahatan perangnya di kawasan Asia Pasifik, serta relevansinya bagi hari ini.",
    ulasan: [
      "Buku berbahasa Inggris ini menelusuri akar militerisme Jepang dan rangkaian kejahatan perang yang menyertainya di kawasan Asia Pasifik pada paruh pertama abad ke-20. Hendrajit menyusunnya bukan sebagai catatan sejarah semata, melainkan sebagai bahan pembacaan atas dinamika keamanan kawasan hari ini.",
      "Penulis menautkan memori sejarah itu dengan pertanyaan kontemporer: bagaimana warisan militerisme membentuk persepsi antarnegara di Asia Timur, dan sejauh mana potensi ancaman keamanan baru dapat muncul dari pergeseran postur pertahanan di kawasan.",
      "Dengan pendekatan lintas disiplin antara sejarah dan geopolitik, buku ini menjadi pengingat bahwa masa lalu tidak pernah benar-benar selesai. Ia relevan bagi pembaca yang ingin memahami mengapa isu-isu lama kembali mengemuka dalam konstelasi Asia Pasifik masa kini.",
    ],
  },
];

export function getBook(slug: string): Book | undefined {
  return books.find((b) => b.slug === slug);
}
