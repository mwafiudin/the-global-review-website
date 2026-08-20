import "server-only";

import { unstable_cache } from "next/cache";
import {
  pengurus as contohPengurus,
  type Pengurus,
} from "@/data/pages/pengurus-gfi";
import { redaksiCopy, type RedaksiCopy } from "@/data/pages/redaksi";
import type { Lang } from "@/lib/locale-routing";
import {
  dedup,
  wpFetchAllFresh,
  wpFetchByIdsFresh,
  type WpRendered,
} from "./client";
import { cleanText } from "./map";

/**
 * Pengurus GFI dan masthead Redaksi dari CPT tgr_orang (rest_base: orang).
 * Satu koleksi untuk dua halaman, dibedakan meta tgr_kelompok; urutan
 * tampil = menu_order (kotak Atribut di wp-admin). Jabatan/bio dua bahasa —
 * kolom EN yang kosong jatuh ke versi Indonesia.
 *
 * Koleksi kosong/gagal → data src/data/pages (konten asli yang sama dengan
 * yang di-seed ke WordPress), pola yang sama dengan bedah buku.
 */

interface WpOrang {
  id: number;
  title: WpRendered;
  menu_order?: number;
  featured_media?: number;
  meta?: {
    tgr_kelompok?: string;
    tgr_jabatan?: string;
    tgr_jabatan_en?: string;
    tgr_bio?: string;
    tgr_bio_en?: string;
  };
}

export interface Orang {
  nama: string;
  urutan: number;
  kelompok: "pengurus" | "redaksi";
  foto?: string;
  jabatan: string;
  jabatanEn: string;
  bio: string;
  bioEn: string;
}

type Masthead = RedaksiCopy["masthead"];

/** Satu pos tgr_orang → Orang; tanpa nama atau jabatan tidak dirender. */
export function wpOrangToOrang(item: WpOrang, foto?: string): Orang | null {
  const nama = cleanText(item.title.rendered);
  const jabatan = item.meta?.tgr_jabatan?.trim() ?? "";
  if (!nama || !jabatan) return null;
  return {
    nama,
    urutan: item.menu_order ?? 0,
    kelompok: item.meta?.tgr_kelompok === "redaksi" ? "redaksi" : "pengurus",
    foto,
    jabatan,
    jabatanEn: item.meta?.tgr_jabatan_en?.trim() || jabatan,
    bio: item.meta?.tgr_bio?.trim() ?? "",
    bioEn: item.meta?.tgr_bio_en?.trim() || item.meta?.tgr_bio?.trim() || "",
  };
}

/**
 * Orang kelompok pengurus → bentuk yang dipakai halaman Pengurus GFI.
 * Kartu pengurus butuh foto dan bio; tanpa keduanya tidak ditampilkan.
 */
export function orangKePengurus(o: Orang): Pengurus | null {
  if (!o.foto || !o.bio) return null;
  return {
    nama: o.nama,
    foto: o.foto,
    teks: {
      id: { jabatan: o.jabatan, bio: o.bio },
      en: { jabatan: o.jabatanEn, bio: o.bioEn },
    },
  };
}

/** Orang kelompok redaksi → baris masthead per bahasa. */
export function mastheadDari(daftar: Orang[]): Record<Lang, Masthead> {
  const redaksi = daftar.filter((o) => o.kelompok === "redaksi");
  return {
    id: redaksi.map((o) => ({ peran: o.jabatan, nama: o.nama })),
    en: redaksi.map((o) => ({ peran: o.jabatanEn, nama: o.nama })),
  };
}

const cachedOrang = unstable_cache(
  async (): Promise<Orang[]> => {
    const items = await wpFetchAllFresh<WpOrang>("/orang", {
      query: {
        orderby: "menu_order",
        order: "asc",
        _fields: "id,title,menu_order,featured_media,meta",
      },
    });

    // Satu batch untuk seluruh potret (dipotong per 100 ID).
    const media = await wpFetchByIdsFresh<{
      id: number;
      source_url?: string;
      media_details?: { sizes?: { large?: { source_url?: string } } };
    }>(
      "/media",
      items.map((o) => o.featured_media ?? 0),
      { query: { _fields: "id,source_url,media_details" } }
    );
    const fotoById = new Map<number, string>();
    for (const m of media) {
      const url = m.media_details?.sizes?.large?.source_url ?? m.source_url;
      if (url) fotoById.set(m.id, url);
    }

    return items
      .map((item) =>
        wpOrangToOrang(item, fotoById.get(item.featured_media ?? 0))
      )
      .filter((o): o is Orang => o !== null)
      .sort((a, b) => a.urutan - b.urutan);
  },
  ["wp-orang"],
  { revalidate: 300, tags: ["wp:orang"] }
);

/** Seluruh profil, urut menu_order; kosong/gagal → []. */
async function semuaOrang(): Promise<Orang[]> {
  return dedup("orang", async () => {
    try {
      return await cachedOrang();
    } catch (err) {
      console.error("[wp] profil orang gagal dibaca, memakai data cadangan:", err);
      return [];
    }
  });
}

/** Pengurus GFI, urut tampil; koleksi kosong/gagal → data cadangan. */
export async function wpPengurus(): Promise<Pengurus[]> {
  const daftar = (await semuaOrang())
    .filter((o) => o.kelompok === "pengurus")
    .map(orangKePengurus)
    .filter((p): p is Pengurus => p !== null);
  return daftar.length > 0 ? daftar : contohPengurus;
}

/** Masthead Susunan Redaksi per bahasa; kosong/gagal → data cadangan. */
export async function wpMasthead(): Promise<Record<Lang, Masthead>> {
  const hasil = mastheadDari(await semuaOrang());
  if (hasil.id.length > 0) return hasil;
  return { id: redaksiCopy.id.masthead, en: redaksiCopy.en.masthead };
}
