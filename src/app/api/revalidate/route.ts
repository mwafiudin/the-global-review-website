import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

/**
 * Penerima webhook dari mu-plugin tgr-revalidate.php: setiap kali redaksi
 * menyimpan/menghapus tulisan di wp-admin, WordPress mem-POST
 * { type, slug, status_new, ... } ke sini dan cache tag terkait langsung
 * kedaluwarsa ({ expire: 0 } — pola webhook yang direkomendasikan docs
 * revalidateTag Next 16). ISR berkala tetap berjalan sebagai jaring
 * pengaman bila webhook gagal terkirim.
 *
 * REVALIDATE_SECRET boleh berisi beberapa nilai dipisah koma supaya
 * rotasi bisa bertahap (tambah dulu di Vercel, lalu tukar di wp-config).
 */

function secretValid(header: string | null): boolean {
  const configured = process.env.REVALIDATE_SECRET;
  if (!configured || !header) return false;
  const provided = Buffer.from(header);
  return configured
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .some((secret) => {
      const expected = Buffer.from(secret);
      return (
        expected.length === provided.length &&
        timingSafeEqual(expected, provided)
      );
    });
}

// Slug WordPress sah bisa memuat underscore, titik, dan %-encoding
// (judul non-Latin); tetap dibatasi karakter aman-URL.
const SLUG_RE = /^[a-zA-Z0-9._~%-]{1,200}$/;

export async function POST(request: NextRequest) {
  if (!process.env.REVALIDATE_SECRET) {
    return Response.json(
      { error: "REVALIDATE_SECRET belum dikonfigurasi" },
      { status: 503 }
    );
  }
  if (!secretValid(request.headers.get("x-tgr-secret"))) {
    return new Response(null, { status: 401 });
  }

  let payload: { slug?: unknown };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "payload bukan JSON" }, { status: 400 });
  }

  const slug = typeof payload.slug === "string" ? payload.slug : "";
  if (!SLUG_RE.test(slug)) {
    return Response.json({ error: "slug tidak valid" }, { status: 400 });
  }

  // Tag nama sendiri (halaman detail) + seluruh daftar (beranda, rubrik,
  // penulis, pencarian) — semuanya di-tag wp:posts di lapisan fetch.
  const tags = [`wp:post:${slug}`, "wp:posts"];
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return Response.json({ revalidated: tags });
}
