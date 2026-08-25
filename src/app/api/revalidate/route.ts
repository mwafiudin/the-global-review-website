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

const CPT_TAGS = new Map([
  ["tgr_podcast", "wp:podcasts"],
  ["tgr_album", "wp:albums"],
  ["tgr_poll", "wp:polls"],
  ["tgr_orang", "wp:orang"],
]);

/**
 * Tag yang gugur untuk satu kiriman webhook. Laman (page) punya tag bundel
 * sendiri: isi halaman statis di-cache sebagai satu entri wp-halaman, dan
 * sebelumnya simpan Laman keliru menggugurkan wp:posts. Kategori & user
 * (mu-plugin ≥1.2) menggugurkan peta rubrik/penulis yang di-cache sehari
 * penuh — plus wp:posts, karena rubrik dan penulis tiap artikel sudah
 * terpanggang di entri daftar.
 */
export function tagsUntuk(type: string, slug: string): string[] {
  if (type === "page") return ["wp:halaman"];
  if (type === "category") return ["wp:categories", "wp:posts"];
  if (type === "user") return ["wp:users", "wp:posts"];
  const tagCpt = CPT_TAGS.get(type);
  return tagCpt ? [tagCpt] : [`wp:post:${slug}`, "wp:posts"];
}

/**
 * WordPress mengirim post_name apa adanya — ter-persen-encode untuk judul
 * non-Latin — sedangkan tag wp:post:{slug} di lapisan fetch dibangun dari
 * param rute yang sudah di-decode Next. Keduanya digugurkan sekaligus:
 * menggugurkan tag yang tak pernah dipakai adalah no-op, jadi bentuk ini
 * kebal ke arah mana pun encoding param berubah.
 */
export function slugVarian(slug: string): string[] {
  if (!slug.includes("%")) return [slug];
  try {
    const decoded = decodeURIComponent(slug);
    return decoded === slug ? [slug] : [slug, decoded];
  } catch {
    // %-sequence cacat (lolos SLUG_RE tapi bukan encoding sah) — pakai mentah.
    return [slug];
  }
}

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

  let payload: { slug?: unknown; type?: unknown };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "payload bukan JSON" }, { status: 400 });
  }

  const slug = typeof payload.slug === "string" ? payload.slug : "";
  if (!SLUG_RE.test(slug)) {
    return Response.json({ error: "slug tidak valid" }, { status: 400 });
  }

  // Tipe konten khusus punya tag koleksi sendiri; tulisan biasa memakai
  // tag nama sendiri (halaman detail) + seluruh daftar (beranda, rubrik,
  // penulis, pencarian) yang di-tag wp:posts di lapisan fetch. Map, bukan
  // objek: lookup objek ikut membaca kunci warisan Object.prototype, jadi
  // type "constructor"/"toString" akan lolos sebagai tag palsu.
  const type = typeof payload.type === "string" ? payload.type : "post";
  const tags = [
    ...new Set(slugVarian(slug).flatMap((varian) => tagsUntuk(type, varian))),
  ];
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return Response.json({ revalidated: tags });
}
