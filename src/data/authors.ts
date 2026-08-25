import { Author } from "@/lib/types";

export const authors: Author[] = [
  {
    slug: "hendrajit",
    name: "Hendrajit",
    role: "Direktur Eksekutif GFI",
    avatar: "/images/hendrajit-direktur-eksekutif-gfi.jpg",
    bio: "Pengkaji geopolitik, memprakarsai berdirinya Global Future Institute pada 11 Oktober 2007. Penulis buku Perang Asimetris & Skema Penjajahan Gaya Baru.",
  },
  {
    slug: "m-arief-pranoto",
    name: "M Arief Pranoto",
    role: "Direktur Pengkajian Geopolitik dan Studi Kewilayahan",
    bio: "Research Associate GFI sejak 2009, menekuni kajian geopolitik dan studi kewilayahan.",
  },
  {
    slug: "rusman",
    name: "Rusman",
    role: "Direktur Teknologi Informasi",
    avatar: "/images/rusman-direktur-teknologi-informasi-gfi.jpg",
    bio: "Perintis GFI sejak 2008, wartawan tabloid DeTAK, jurnalis terbaik versi Yayasan KEHATI dan Lembaga Pers Dr. Supomo tahun 2000.",
  },
  {
    slug: "yudi-kobo",
    name: "Yudi Kobo",
    role: "Redaksi",
    bio: "Redaktur The Global Review.",
  },
  {
    slug: "redaksi",
    name: "Redaksi TGR",
    role: "Tim Redaksi",
  },
];

export function getAuthor(slug: string): Author {
  // Cadangan dicari lewat slug, bukan indeks: menyisipkan penulis baru di
  // tengah larik tidak boleh diam-diam mengganti profil cadangan semua
  // tulisan tak terpetakan (byline, avatar, dan bio-nya ikut salah).
  return (
    authors.find((a) => a.slug === slug) ??
    authors.find((a) => a.slug === "redaksi") ??
    authors[0]
  );
}
