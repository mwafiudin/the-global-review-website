import type { NextRequest } from "next/server";
import { alamatKlien } from "@/lib/client-ip";
import { buatRem } from "@/lib/rate-limit";
import { wpApiBase } from "@/lib/wp/client";

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
 * membatasi), melainkan penahan agar satu peramban tidak bisa mengulang
 * kirim beruntun.
 */
export const { terlaluSering } = buatRem({ jendelaMs: 60_000, maksPerJendela: 5 });

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET?.split(",")[0]?.trim();
  const wpUrl = wpApiBase();
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

  // IP pembaca dari header proxy yang bisa dipercaya (lib/client-ip). Tanpa
  // itu SEMUA pengunjung berbagi satu ember rate-limit — pengirim sah ke-6
  // dalam semenit tertolak — dan WordPress memakai alamat egress Next.
  const ip = alamatKlien(request.headers);
  if (!ip) {
    console.warn("[api/subscribe] alamat IP tak terbaca — rate limit memakai ember bersama");
  }
  if (terlaluSering(ip ?? "anon")) {
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
        // Gerbang per-IP di mu-plugin memakai ini; tanpa header ia hanya
        // melihat alamat egress server, sama untuk semua pembaca.
        ...(ip ? { "X-TGR-Client-IP": ip } : {}),
      },
      body: JSON.stringify({
        email: payload.email.trim(),
        sumber: typeof payload.sumber === "string" ? payload.sumber.slice(0, 200) : "",
      }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) {
      // Sama seperti /api/vote: penolakan yang memang salah pengirim
      // diteruskan apa adanya, 502 hanya untuk kegagalan di luar itu.
      const diteruskan = [400, 429].includes(res.status);
      return Response.json(
        { error: "Pendaftaran gagal, coba lagi nanti" },
        { status: diteruskan ? res.status : 502 }
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
