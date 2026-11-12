import type { NextRequest } from "next/server";
import { featuredArticles, searchArticles } from "@/lib/wp/articles";

/**
 * Proxy pencarian untuk komponen Search (client). Browser tidak pernah
 * bicara langsung ke WordPress — kueri diteruskan ke wp/v2/posts?search=
 * di server, hasilnya dipetakan ke tipe Article ringan (tanpa body).
 */
/**
 * Normalisasi mengecilkan ruang kunci cache. Tanda baca dibuang karena
 * kueri diteruskan ke WordPress dari IP kita: "../../etc/passwd" atau
 * "<script>" dari pemindai dihitung firewall host sebagai serangan kita.
 * Pencarian WordPress sendiri mengabaikan tanda baca.
 */
export function normalisasiKueri(mentah: string): string {
  return mentah
    .replace(/[^\p{L}\p{N}\p{M}'-]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .slice(0, 100);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  try {
    if (params.get("featured")) {
      return Response.json(await featuredArticles(5));
    }
    // Minimal 2 huruf supaya endpoint ini tidak jadi penguat beban ke
    // origin WordPress.
    const q = normalisasiKueri(params.get("q") ?? "");
    if (q.length < 2) return Response.json([]);
    return Response.json(await searchArticles(q));
  } catch {
    // WP tak terjangkau: kembalikan kosong agar panel pencarian tetap hidup.
    return Response.json([]);
  }
}
