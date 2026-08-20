export interface Book {
  slug: string;
  judul: string;
  /** Nama untuk byline kartu; ringkas (mis. "Hendrajit dkk."). */
  penulis: string;
  /** Daftar penulis/kontributor lengkap, ditampilkan di halaman ulasan. */
  penulisLengkap?: string;
  penerbit: string;
  /** Tahun terbit; dikosongkan bila belum terkonfirmasi. */
  tahun?: string;
  /** ISBN dari sampul belakang (opsional). */
  isbn?: string;
  cover: string;
  /** Ringkasan pendek untuk kartu daftar. */
  ringkasan: string;
  /** Ulasan lengkap, tiap elemen satu paragraf. */
  ulasan: string[];
  /** Slug podcast/video terkait (opsional) untuk embed di halaman ulasan. */
  podcastTerkait?: string;
  /** Satu buku ber-nilai true tampil di kartu "Buku pilihan" sidebar. */
  unggulan?: boolean;
}

export const books: Book[] = [
  {
    slug: "perang-asimetris-skema-penjajahan-gaya-baru",
    judul: "Perang Asimetris & Skema Penjajahan Gaya Baru",
    penulis: "Hendrajit",
    penerbit: "Global Future Institute",
    tahun: "2019",
    unggulan: true,
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
    judul: "Tangan-Tangan Amerika: Kisah Operasi AS di Pelbagai Belahan Dunia",
    penulis: "Hendrajit dkk.",
    penerbit: "Global Future Institute",
    tahun: "2010",
    isbn: "978-602-97209-0-7",
    cover:
      "/images/buku-tangan-tangan-amerika-kisah-operasi-as-di-pelbagai-belahan-dunia.jpg",
    ringkasan:
      "Menelusuri jejak operasi Amerika Serikat di berbagai kawasan dunia — dari agresi militer hingga perang ekonomi yang berlangsung tanpa satu peluru pun.",
    ulasan: [
      "Buku ini berangkat dari sebuah catatan yang jarang diakui secara terbuka: dalam sejarah perang modern, Amerika Serikat memegang rekor tertinggi sebagai negara agresor. Merujuk William Blum dalam Killing Hope: U.S. Military and CIA Interventions Since World War II, para penulis mengingatkan bahwa sejak memproklamasikan kemerdekaannya pada 1776, AS terus melancarkan arus tetap pertempuran — sembilan perang besar dan lebih dari dua ratus penyerbuan angkatan bersenjata.",
      "Namun kekuatan utama buku ini justru terletak pada babak yang lebih senyap. Hendrajit dan para kontributornya menaruh perhatian pada perang ekonomi: bentuk peperangan yang berlangsung tenang, nyaris tanpa gegap gempita, tetapi memiliki daya rusak yang setara dengan operasi militer. Peperangan semacam ini dilancarkan untuk melumpuhkan lawan tanpa meletuskan sebutir peluru pun.",
      "Pada tingkat yang paling ekstrem, tulis mereka, perang ekonomi menunjukkan daya hancur yang tak ubahnya bom nuklir — ia melemahkan rakyat dan melumpuhkan infrastruktur secara perlahan. Justru karena tidak terlihat sebagai kekerasan, korbannya kerap tidak menyadari sedang berada dalam sebuah medan pertempuran.",
      "Bagi pembaca Indonesia, nilai buku ini terletak pada refleksinya. Para penulis tidak berhenti pada kritik terhadap kekuatan asing, melainkan menegaskan pentingnya kewaspadaan dan kemandirian dalam merumuskan politik luar negeri yang benar-benar berpijak pada kepentingan nasional.",
    ],
  },
  {
    slug: "neo-kolonialisme-as-di-asia",
    judul: "Neo Kolonialisme AS di Asia: Perspektif Indonesia",
    penulis: "Hendrajit dkk.",
    penulisLengkap:
      "Hendrajit, Rahadi Teguh Wiratama, Abriyanto Satrio, Arismunandar, Agung Marsudi D. Susanto, Dina, dkk.",
    penerbit: "Indonesia Consulting Group",
    tahun: "2024",
    cover: "/images/buku-neo-kolonialisme-as-di-asia-perspektif-indonesia.jpg",
    ringkasan:
      "Membaca wajah baru kolonialisme Amerika Serikat di Asia — bukan lewat pendudukan wilayah, melainkan penguasaan ekonomi, politik, dan arah kebijakan.",
    ulasan: [
      "Jika kolonialisme klasik ditandai bendera yang ditancapkan di tanah jajahan, neo-kolonialisme bekerja jauh lebih halus: melalui kesepakatan dagang, ketergantungan modal, dan penyelarasan kebijakan. Buku ini menempatkan Asia sebagai medan utama tempat pola tersebut berlangsung, dengan Amerika Serikat sebagai aktor yang paling konsisten memainkannya.",
      "Yang membedakan buku ini dari kajian sejenis adalah sudut pandangnya yang tegas: perspektif Indonesia. Para penulis tidak memotret Asia dari kacamata pengamat luar, melainkan dari posisi sebuah negara yang berada tepat di persilangan kepentingan kekuatan besar — dan karena itu paling merasakan konsekuensinya.",
      "Pembahasannya menautkan dimensi ekonomi, politik, dan keamanan sebagai satu kesatuan. Penguasaan sumber daya, arsitektur perjanjian regional, hingga pembentukan opini publik dibaca sebagai instrumen yang saling menopang, bukan peristiwa yang berdiri sendiri.",
      "Ditulis keroyokan oleh sejumlah pengkaji — antara lain Hendrajit, Rahadi Teguh Wiratama, Abriyanto Satrio, Arismunandar, dan Agung Marsudi D. Susanto — buku ini hadir sebagai bunga rampai, bukan risalah tunggal. Keragaman latar penulisnya membuat satu tema besar dibedah dari beberapa sudut sekaligus.",
      "Terbit pada 2024 lewat Indonesia Consulting Group, buku ini melengkapi jalur pemikiran yang telah dirintis Global Future Institute mengenai perang asimetris dan penjajahan gaya baru. Ia menawarkan kerangka bagi pembaca yang ingin memahami mengapa kemerdekaan politik tidak otomatis berarti kemerdekaan dalam menentukan arah kebijakan.",
    ],
  },
  {
    slug: "japanese-militarism-war-crimes-asia-pacific",
    judul: "Japanese Militarism & Its War Crimes in Asia Pacific Region",
    penulis: "Hendrajit (Ed.)",
    penerbit: "Global Future Institute",
    tahun: "2011",
    isbn: "978-602-97209-1-4",
    cover:
      "/images/buku-japanese-militarism-and-its-war-crimes-in-asia-pacific-region.jpg",
    ringkasan:
      "Kajian militerisme Jepang dan kejahatan perangnya di Asia Pasifik, hingga sinyal kebangkitan kembali kekuatan militernya hari ini.",
    ulasan: [
      "Buku berbahasa Inggris yang disunting Hendrajit ini bermula dari sebuah paradoks pascaperang. Setelah Perang Dunia II, Jepang dipaksa melucuti seluruh kekuatan bersenjatanya, termasuk kepemilikan persenjataan strategis. Dalam skema itu, Amerika Serikat justru menjadi aktor kunci: ia menerima penyerahan Jepang sebagai kekuatan militer fasis, lalu mengubahnya menjadi raksasa ekonomi di Asia Pasifik.",
      "Persoalannya, konstelasi global bergeser. Ketika Washington mulai memandang Cina sebagai adidaya baru sekaligus ancaman utama di kawasan, posisi Jepang sebagai sekutu tradisional ikut dihitung ulang. Para penyunting menangkap kemungkinan yang tidak nyaman: upaya memperkuat kembali kekuatan militer Jepang boleh jadi memperoleh dukungan diam-diam dari para pengambil keputusan keamanan nasional AS.",
      "Sinyal itu, menurut buku ini, tampak pada pembentukan panel ahli oleh pemerintah Jepang untuk merevisi kebijakan pertahanan yang selama ini bersifat defensif semata. Perubahan tersebut dibaca sebagai tanda proses pengambilan keputusan yang dapat mengaktifkan kembali angkatan bersenjata Jepang — dari karakter pasif menjadi kekuatan militer yang agresif, bahkan lebih ekspansif dari masa lalu.",
      "Bagian penutupnya membawa persoalan itu pulang ke Indonesia. Berkaitan dengan kejahatan perang Jepang sepanjang 1942–1945, buku ini menyerukan agar seluruh elemen strategis bangsa bersama-sama menuntut pertanggungjawaban moral maupun material atas kerusakan besar yang ditimbulkan — pada ekonomi, sumber daya alam, politik, martabat manusia, sosial, hingga kebudayaan.",
    ],
  },
];

export function getBook(slug: string): Book | undefined {
  return books.find((b) => b.slug === slug);
}

/** "Global Future Institute (2019)" — tahun disembunyikan bila belum diketahui. */
export function bookImprint(book: Book): string {
  return book.tahun ? `${book.penerbit} (${book.tahun})` : book.penerbit;
}

/**
 * "Hendrajit, Global Future Institute (2010)" — bagian yang kosong ikut
 * hilang beserta pemisahnya. Ulasan yang datang dari kategori Bedah Buku
 * di WordPress belum tentu punya identitas penerbit, dan tanpa ini
 * barisnya berakhir dengan koma menggantung.
 */
export function bookByline(book: Book): string {
  return [book.penulis, bookImprint(book)].filter(Boolean).join(", ");
}
