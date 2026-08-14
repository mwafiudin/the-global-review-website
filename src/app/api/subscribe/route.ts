import type { NextRequest } from "next/server";

/**
 * Pendaftaran buletin: browser mengirim ke sini, dan server meneruskannya
 * ke WordPress (`tgr/v1/subscribe`) dengan secret yang sama seperti webhook
 * revalidasi. Alamat WordPress-nya tidak pernah tersentuh browser, jadi
 * penyimpanan pelanggan tidak bisa dibanjiri langsung dari luar.
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

/**
 * Rem per alamat IP di memori proses. Bukan pengaman utama (WordPress juga
 * membatasi, dan lambda bisa banyak instansi), melainkan penahan agar satu
 * peramban tidak bisa mengulang kirim beruntun.
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
  const wpUrl = process.env.WP_API_URL;
  if (!secret || !wpUrl) {
    return Response.json(
      { error: "Pendaftaran buletin belum dikonfigurasi" },
      { status: 503 }
    );
  }

  let payload: { email?: unknown; sumber?: unknown; situs?: unknown };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "payload bukan JSON" }, { status: 400 });
  }

  // Umpan bot: kolom tersembunyi yang hanya terisi oleh pengisi otomatis.
  // Dijawab 200 agar bot tidak belajar bahwa jebakannya ketahuan.
  if (typeof payload.situs === "string" && payload.situs !== "") {
    return Response.json({ terdaftar: true });
  }

  if (!emailValid(payload.email)) {
    return Response.json({ error: "Alamat email tidak sah" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  if (terlaluSering(ip)) {
    return Response.json(
      { error: "Terlalu banyak percobaan, coba lagi sebentar lagi" },
      { status: 429 }
    );
  }

  try {
    const res = await fetch(`${wpUrl}/tgr/v1/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TGR-Secret": secret,
        "User-Agent": "TGR-Frontend/1.0",
      },
      body: JSON.stringify({
        email: payload.email.trim(),
        sumber: typeof payload.sumber === "string" ? payload.sumber.slice(0, 200) : "",
      }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) {
      return Response.json(
        { error: "Pendaftaran gagal, coba lagi nanti" },
        { status: res.status === 429 ? 429 : 502 }
      );
    }
    return Response.json({ terdaftar: true });
  } catch {
    return Response.json(
      { error: "Pendaftaran gagal, coba lagi nanti" },
      { status: 502 }
    );
  }
}
