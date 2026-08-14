import type { NextRequest } from "next/server";

/**
 * Suara jajak pendapat: browser mengirim ke sini, server meneruskannya ke
 * WordPress (`tgr/v1/vote`) dengan secret yang sama seperti webhook
 * revalidasi. Pola yang sama dengan /api/subscribe — penghitung suara tidak
 * bisa dinaikkan langsung dari peramban siapa pun.
 *
 * Balasan memuat rekap terbaru supaya kartu poll bisa langsung menampilkan
 * angka yang benar tanpa menunggu jendela cache berikutnya.
 */

const OPSI_RE = /^[a-z0-9_-]{1,64}$/;

export function opsiValid(nilai: unknown): nilai is string {
  return typeof nilai === "string" && OPSI_RE.test(nilai);
}

export function pollValid(nilai: unknown): nilai is number {
  return typeof nilai === "number" && Number.isInteger(nilai) && nilai > 0;
}

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET?.split(",")[0]?.trim();
  const wpUrl = process.env.WP_API_URL;
  if (!secret || !wpUrl) {
    return Response.json(
      { error: "Jajak pendapat belum dikonfigurasi" },
      { status: 503 }
    );
  }

  let payload: { poll?: unknown; opsi?: unknown };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "payload bukan JSON" }, { status: 400 });
  }

  if (!pollValid(payload.poll) || !opsiValid(payload.opsi)) {
    return Response.json({ error: "Pilihan tidak sah" }, { status: 400 });
  }

  try {
    const res = await fetch(`${wpUrl}/tgr/v1/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TGR-Secret": secret,
        "User-Agent": "TGR-Frontend/1.0",
      },
      body: JSON.stringify({ poll: payload.poll, opsi: payload.opsi }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as {
      hasil?: Record<string, number>;
    } | null;
    if (!res.ok) {
      return Response.json(
        { error: "Suara gagal dicatat" },
        { status: res.status === 409 ? 409 : 502 }
      );
    }
    return Response.json({ hasil: data?.hasil ?? {} });
  } catch {
    return Response.json({ error: "Suara gagal dicatat" }, { status: 502 });
  }
}
