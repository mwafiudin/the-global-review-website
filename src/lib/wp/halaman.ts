import "server-only";

import { unstable_cache } from "next/cache";
import {
  tentangGfiCopy,
  type TentangGfiCopy,
} from "@/data/pages/tentang-gfi";
import {
  tentangTgrCopy,
  type TentangTgrCopy,
} from "@/data/pages/tentang-tgr";
import { pengurusGfiCopy } from "@/data/pages/pengurus-gfi";
import {
  alamatKantor,
  hubungiKamiCopy,
  petaQuery,
  type HubungiKamiCopy,
} from "@/data/pages/hubungi-kami";
import type { Lang } from "@/lib/locale-routing";
import { dedup, wpFetchFresh } from "./client";

/**
 * Isi halaman statis dari meta Laman WordPress (mu-plugin ≥3.0, kotak
 * "Isi Halaman — Situs Baru"). Setiap field jatuh kembali ke modul
 * src/data/pages bila metanya kosong ATAU WordPress tak terjangkau, jadi
 * halaman tidak pernah tampil rompal; field _en yang kosong jatuh ke
 * versi Indonesia lebih dulu.
 *
 * PENTING — Laman dirujuk lewat ID, bukan slug: slug Laman lama saling
 * tertukar (id 574 ber-slug "tentang-gfi" padahal judulnya "Tentang The
 * Global Review", sementara id 576 ber-slug "tentang-gfi-2"), jadi lookup
 * slug justru mengikat ke Laman yang salah. Konsekuensinya: menghapus lalu
 * membuat ulang sebuah Laman mengganti ID-nya — metaHalaman() mencatat
 * galat saat itu terjadi supaya tidak diam-diam menyajikan teks kode; ID
 * barunya tinggal diperbarui di HALAMAN_ID.
 */

export const HALAMAN_ID = {
  tentangTgr: 574,
  tentangGfi: 576,
  hubungiKami: 572,
  pengurusGfi: 611,
} as const;

export type MetaHalaman = Record<string, string | undefined>;

/** Satu nilai teks: meta bahasa aktif → meta Indonesia → teks di kode. */
export function teks(
  meta: MetaHalaman,
  kunci: string,
  lang: Lang,
  cadangan: string
): string {
  const utama = lang === "en" ? meta[`${kunci}_en`]?.trim() : undefined;
  return utama || meta[kunci]?.trim() || cadangan;
}

/** Daftar butir dari textarea "satu item per baris". */
export function butir(
  meta: MetaHalaman,
  kunci: string,
  lang: Lang,
  cadangan: string[]
): string[] {
  const mentah =
    (lang === "en" ? meta[`${kunci}_en`]?.trim() : undefined) ||
    meta[kunci]?.trim() ||
    "";
  const daftar = mentah
    .split(/\r?\n+/)
    .map((baris) => baris.trim())
    .filter(Boolean);
  return daftar.length > 0 ? daftar : cadangan;
}

/* ── Penggabungan per halaman (murni, teruji) ──────────────────────── */

export function tentangTgrDariWp(
  lang: Lang,
  meta: MetaHalaman
): TentangTgrCopy {
  const cadangan = tentangTgrCopy[lang];
  return {
    ...cadangan,
    lead: teks(meta, "tgr_lead", lang, cadangan.lead),
    paragraphs: butir(meta, "tgr_paragraf", lang, cadangan.paragraphs),
  };
}

export function tentangGfiDariWp(
  lang: Lang,
  meta: MetaHalaman
): TentangGfiCopy {
  const cadangan = tentangGfiCopy[lang];
  return {
    ...cadangan,
    lead: teks(meta, "tgr_lead", lang, cadangan.lead),
    pembuka: butir(meta, "tgr_paragraf", lang, cadangan.pembuka),
    isuHeading: teks(meta, "tgr_isu_judul", lang, cadangan.isuHeading),
    isuIntro: teks(meta, "tgr_isu_intro", lang, cadangan.isuIntro),
    isuPokok: butir(meta, "tgr_isu_butir", lang, cadangan.isuPokok),
    visiQuote: teks(meta, "tgr_visi", lang, cadangan.visiQuote),
    visiCaption: teks(meta, "tgr_visi_label", lang, cadangan.visiCaption),
    misi: butir(meta, "tgr_misi_butir", lang, cadangan.misi),
    fokusIntro: teks(meta, "tgr_fokus_intro", lang, cadangan.fokusIntro),
    fokusKegiatan: butir(meta, "tgr_fokus_butir", lang, cadangan.fokusKegiatan),
    fokusPenutup: teks(meta, "tgr_fokus_penutup", lang, cadangan.fokusPenutup),
  };
}

export function pengurusDariWp(
  lang: Lang,
  meta: MetaHalaman
): { lead: string; pengantar: string[] } {
  const cadangan = pengurusGfiCopy[lang];
  return {
    lead: teks(meta, "tgr_lead", lang, cadangan.lead),
    pengantar: butir(meta, "tgr_paragraf", lang, [cadangan.pengantar]),
  };
}

export function hubungiDariWp(
  lang: Lang,
  meta: MetaHalaman
): { copy: HubungiKamiCopy; alamat: string[]; petaQ: string } {
  const cadangan = hubungiKamiCopy[lang];
  return {
    copy: {
      ...cadangan,
      lead: teks(meta, "tgr_lead", lang, cadangan.lead),
      jamTeks: teks(meta, "tgr_jam", lang, cadangan.jamTeks),
    },
    alamat: butir(meta, "tgr_alamat", lang, alamatKantor.split("\n")),
    petaQ: teks(meta, "tgr_peta_q", lang, petaQuery),
  };
}

/* ── Pengambilan & cache ───────────────────────────────────────────── */

const SEMUA_ID = Object.values(HALAMAN_ID);

const cachedHalaman = unstable_cache(
  async (): Promise<Record<number, MetaHalaman>> => {
    const pages = await wpFetchFresh<{ id: number; meta?: MetaHalaman }[]>(
      "/pages",
      { query: { include: SEMUA_ID.join(","), per_page: 100, _fields: "id,meta" } }
    );
    const hasil: Record<number, MetaHalaman> = {};
    for (const p of pages) hasil[p.id] = p.meta ?? {};
    return hasil;
  },
  ["wp-halaman"],
  { revalidate: 300, tags: ["wp:halaman"] }
);

/** Meta satu Laman; gagal/kosong → {} sehingga cadangan kode yang tampil. */
export async function metaHalaman(
  id: (typeof HALAMAN_ID)[keyof typeof HALAMAN_ID]
): Promise<MetaHalaman> {
  return dedup("halaman", async () => {
    try {
      return await cachedHalaman();
    } catch (err) {
      console.error("[wp] isi halaman gagal dibaca, memakai teks kode:", err);
      return {} as Record<number, MetaHalaman>;
    }
  }).then((semua) => {
    // Fetch berhasil tapi ID-nya absen = Laman-nya dihapus/dibuat ulang di
    // wp-admin (ID baru). Tanpa catatan ini halaman diam-diam kembali ke
    // teks kode padahal redaksi merasa suntingannya tersimpan.
    if (!semua[id] && Object.keys(semua).length > 0) {
      console.error(
        `[wp] Laman id ${id} tidak ditemukan — dihapus & dibuat ulang? Perbarui HALAMAN_ID di src/lib/wp/halaman.ts`
      );
    }
    return semua[id] ?? {};
  });
}

/* ── API per halaman ───────────────────────────────────────────────── */

export async function wpTentangTgr(lang: Lang): Promise<TentangTgrCopy> {
  return tentangTgrDariWp(lang, await metaHalaman(HALAMAN_ID.tentangTgr));
}

export async function wpTentangGfi(lang: Lang): Promise<TentangGfiCopy> {
  return tentangGfiDariWp(lang, await metaHalaman(HALAMAN_ID.tentangGfi));
}

export async function wpPengurusTeks(lang: Lang) {
  return pengurusDariWp(lang, await metaHalaman(HALAMAN_ID.pengurusGfi));
}

export async function wpHubungi(lang: Lang) {
  return hubungiDariWp(lang, await metaHalaman(HALAMAN_ID.hubungiKami));
}
