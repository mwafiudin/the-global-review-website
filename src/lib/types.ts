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
  /** Satu kata/frasa pada judul yang disorot (hanya untuk hero / featured). */
  highlight?: string;
}
