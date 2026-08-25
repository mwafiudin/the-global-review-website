export interface Author {
  slug: string;
  name: string;
  role: string;
  bio?: string;
  /** Foto potret penulis (opsional). */
  avatar?: string;
}

export interface Category {
  slug: string;
  name: string;
  parent?: string;
  children?: Category[];
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string; // slug kategori (bisa "internasional/asean")
  author: string; // slug author
  date: string; // ISO
  imageSeed: string;
  body: string[];
  featured?: boolean;
  /** Satu kata/frasa pada judul yang disorot (h1 artikel & semua varian kartu). */
  highlight?: string;
  /** URL featured image WordPress; tanpa ini articleImage() memakai
   *  gambar pengganti brand lokal (placeholderImage). */
  imageUrl?: string;
  /** Waktu terbit penuh dari WordPress (jangkar kueri artikel sebelum/sesudah). */
  dateTime?: string;
  /** content.rendered tersanitasi — hanya diisi pada halaman detail. */
  bodyHtml?: string;
  /** Waktu baca (menit) dihitung server; readingMinutes() memprioritaskannya. */
  readMinutes?: number;
}
