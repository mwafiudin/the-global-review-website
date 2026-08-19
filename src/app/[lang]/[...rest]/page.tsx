import { notFound } from "next/navigation";

/**
 * Jaring pengaman 404 global. Proxy menyalurkan semua permintaan halaman ke
 * pohon [lang]; path dua segmen ke atas yang tidak cocok rute mana pun jatuh
 * ke sini dan dirender not-found.tsx lengkap dengan header/footer dalam
 * bahasa yang sesuai. (Satu segmen ditangani [slug] lewat getArticle.)
 */
export default function CatchAll(): never {
  notFound();
}
