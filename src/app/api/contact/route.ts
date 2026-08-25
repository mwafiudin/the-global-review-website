import type { NextRequest } from "next/server";
import { wpApiBase } from "@/lib/wp/client";

/**
 * Formulir kontak: browser mengirim ke sini, dan server meneruskannya ke
 * WordPress (`tgr/v1/contact`) dengan secret yang sama seperti webhook
 * revalidasi — pola yang sama dengan /api/subscribe. Pesan tersimpan di
 * wp-admin sebagai "Pesan Masuk" dan redaksi menerima email pemberitahuan.
 *
 * Sengaja klon mandiri, bukan berbagi helper dengan subscribe: jatah rate
 * limit kedua formulir memang harus terpisah (preseden /api/vote).
 */

/** Cukup ketat untuk menolak salah ketik, tanpa menolak alamat yang sah. */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function emailValid(nilai: unknown): nilai is string {
  return (
    typeof nilai === "string" &&
    nilai.length <= 254 &&
    EMAIL_RE.test(nilai.trim())
  );
}

/** Pilihan subjek yang sah — cermin <select> ContactForm & mu-plugin. */
export const DAFTAR_SUBJEK = [
  "Redaksi & Hak Jawab",
  "Kerja Sama & Kemitraan",
  "Pertanyaan Umum",
  "Lainnya",
] as const;

export interface KirimanKontak {
  nama: string;
  email: string;
  telepon: string;
  subjek: string;
  pesan: string;
}

/**
 * Validasi seluruh field sekaligus; null = lolos, selain itu pesan galat
 * (berbahasa Indonesia — kamus UI memetakannya saat halaman /en).
 */
export function kontakValid(payload: {
  nama?: unknown;
  email?: unknown;
  telepon?: unknown;
  subjek?: unknown;
  pesan?: unknown;
}): { galat: string } | { galat: null; data: KirimanKontak } {
  const nama = typeof payload.nama === "string" ? payload.nama.trim() : "";
  if (!nama || nama.length > 120) return { galat: "Nama wajib diisi" };

  if (!emailValid(payload.email)) return { galat: "Alamat email tidak sah" };

  const telepon =
    typeof payload.telepon === "string" ? payload.telepon.trim() : "";
  if (telepon.length > 40) return { galat: "Nomor telepon terlalu panjang" };

  // Subjek boleh kosong (dropdown belum dipilih) tapi tidak boleh nilai liar:
  // ia ikut menjadi judul email pemberitahuan di sisi WordPress.
  const subjek = typeof payload.subjek === "string" ? payload.subjek : "";
  if (subjek && !DAFTAR_SUBJEK.includes(subjek as (typeof DAFTAR_SUBJEK)[number])) {
    return { galat: "Subjek tidak dikenal" };
  }

  const pesan = typeof payload.pesan === "string" ? payload.pesan.trim() : "";
  if (!pesan) return { galat: "Pesan wajib diisi" };
  if (pesan.length > 5000) return { galat: "Pesan terlalu panjang" };

  return {
    galat: null,
    data: { nama, email: (payload.email as string).trim(), telepon, subjek, pesan },
  };
}

/**
 * Rem per alamat IP di memori proses — penahan agar satu peramban tidak
 * bisa mengulang kirim beruntun; WordPress membatasi lagi di lapis kedua.
 */
const JENDELA_MS = 60_000;
const MAKS_PER_JENDELA = 5;
const jejak = new Map<string, number[]>();

export function terlaluSering(kunci: string, sekarang = Date.now()): boolean {
  const baru = (jejak.get(kunci) ?? []).filter((t) => sekarang - t < JENDELA_MS);
  baru.push(sekarang);
  jejak.set(kunci, baru);
  return baru.length > MAKS_PER_JENDELA;
}

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET?.split(",")[0]?.trim();
  const wpUrl = wpApiBase();
  if (!secret || !wpUrl) {
    return Response.json(
      { error: "Formulir kontak belum dikonfigurasi" },
      { status: 503 }
    );
  }

  let payload: {
    nama?: unknown;
    email?: unknown;
    telepon?: unknown;
    subjek?: unknown;
    pesan?: unknown;
    sumber?: unknown;
    situs?: unknown;
  };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "payload bukan JSON" }, { status: 400 });
  }

  // Umpan bot: kolom tersembunyi yang hanya terisi oleh pengisi otomatis.
  // Dijawab 200 agar bot tidak belajar bahwa jebakannya ketahuan.
  if (typeof payload.situs === "string" && payload.situs !== "") {
    return Response.json({ terkirim: true });
  }

  const hasil = kontakValid(payload);
  if (hasil.galat !== null) {
    return Response.json({ error: hasil.galat }, { status: 400 });
  }

  // x-forwarded-for selalu ada di Vercel; di deployment lain yang tidak
  // menyetelnya, tanpa cadangan ini SEMUA pengunjung berbagi satu ember
  // rate-limit (kunci "") — pengirim sah ke-6 dalam semenit tertolak.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "anon";
  if (ip === "anon") {
    console.warn("[api/contact] alamat IP tak terbaca — rate limit memakai ember bersama");
  }
  if (terlaluSering(ip)) {
    return Response.json(
      { error: "Terlalu banyak percobaan, coba lagi sebentar lagi" },
      { status: 429 }
    );
  }

  try {
    const res = await fetch(`${wpUrl}/tgr/v1/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TGR-Secret": secret,
        "User-Agent": "TGR-Frontend/1.0",
      },
      body: JSON.stringify({
        ...hasil.data,
        sumber: typeof payload.sumber === "string" ? payload.sumber.slice(0, 200) : "",
      }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) {
      // Penolakan yang memang salah pengirim diteruskan apa adanya,
      // 502 hanya untuk kegagalan di luar itu.
      const diteruskan = [400, 429].includes(res.status);
      return Response.json(
        { error: "Pesan gagal terkirim, coba lagi nanti" },
        { status: diteruskan ? res.status : 502 }
      );
    }
    return Response.json({ terkirim: true });
  } catch {
    return Response.json(
      { error: "Pesan gagal terkirim, coba lagi nanti" },
      { status: 502 }
    );
  }
}
