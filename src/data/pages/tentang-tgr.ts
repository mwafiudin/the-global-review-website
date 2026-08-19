import type { Lang } from "@/lib/locale-routing";

/**
 * Copy halaman Tentang The Global Review, kedua bahasa. Record<Lang, …>
 * membuat kolom EN yang hilang jadi galat kompilasi, bukan halaman kosong.
 */
export interface TentangTgrCopy {
  metaTitle: string;
  metaDescription: string;
  title: string;
  lead: string;
  paragraphs: string[];
}

export const tentangTgrCopy: Record<Lang, TentangTgrCopy> = {
  id: {
    metaTitle: "Tentang The Global Review",
    metaDescription:
      "The Global Review merupakan media online yang dimiliki Global Future Institute.",
    title: "Tentang The Global Review",
    lead: "Pemandu informasi perkembangan dunia sejak 2008.",
    paragraphs: [
      "The Global Review merupakan media online yang dimiliki Global Future Institute. Kehadiran The Global Review dengan alamat www.theglobal-review.com mendukung dalam menyebarkan ide-ide terhadap isu-isu yang menjadi kajian dari Global Future Institute.",
      "Website The Global Review merupakan sarana menginformasikan kegiatan-kegiatan GFI seperti seminar, hasil riset dan studi, maupun kegiatan-kegiatan lainnya.",
      "Dasar pemikirannya adalah, bahwa semua rangkaian kegiatan tersebut, pada akhirnya harus bermuara pada dihasilkannya produk-produk penerbitan buku, jurnal, monograf, maupun sarana publikasi lainnya.",
      "Untuk menjembatani itu semua, maka website GFI www.theglobal-review.com untuk sementara akan kami jadikan sebagai basis data maupun informasi, yang mana seluruh lapisan masyarakat baik di Indonesia maupun mancanegara, bisa mengakses secara langsung informasi maupun kajian-kajian yang dibuat oleh GFI.",
      "Sehingga seluruh hasil seri pertemuan, riset dan studi, maupun liputan-liputan yang bersifat analisis berita mengenai perkembangan dan dinamika global dan regional, bisa kami sosialisasikan secepat mungkin kepada masyarakat luas melalui situs kami. Dan terdokumentasikan secara sistematis baik melalui situs theglobal-review.com baik melalui rubrik-rubrik yang ada didalamnya maupun yang terdapat dalam rubrik arsip.",
    ],
  },
  en: {
    metaTitle: "About The Global Review",
    metaDescription:
      "The Global Review is an online publication owned by the Global Future Institute.",
    title: "About The Global Review",
    lead: "Your guide to world affairs since 2008.",
    paragraphs: [
      "The Global Review is an online publication owned by the Global Future Institute. Its presence at www.theglobal-review.com helps disseminate ideas on the issues studied by the Global Future Institute.",
      "The Global Review website is a channel for sharing GFI activities such as seminars, research and study findings, and other programs.",
      "The underlying idea is that all of these activities should ultimately culminate in published works — books, journals, monographs, and other forms of publication.",
      "To bridge all of this, the GFI website www.theglobal-review.com serves for the time being as a base of data and information, so that people of all walks of life, in Indonesia and abroad, can directly access the information and studies produced by GFI.",
      "In this way, the results of our meeting series, research and studies, and analytical coverage of global and regional developments can be shared with the wider public as quickly as possible through our site — and documented systematically on theglobal-review.com, both in its sections and in the archive.",
    ],
  },
};
