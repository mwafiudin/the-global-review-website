import type { NextRequest } from "next/server";
import { featuredArticles, searchArticles } from "@/lib/wp/articles";

/**
 * Proxy pencarian untuk komponen Search (client). Browser tidak pernah
 * bicara langsung ke WordPress — kueri diteruskan ke wp/v2/posts?search=
 * di server, hasilnya dipetakan ke tipe Article ringan (tanpa body).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  try {
    if (params.get("featured")) {
      return Response.json(await featuredArticles(5));
    }
    // Normalisasi mengecilkan ruang kunci cache; minimal 2 huruf supaya
    // endpoint ini tidak jadi penguat beban ke origin WordPress.
    const q = (params.get("q") ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase()
      .slice(0, 100);
    if (q.length < 2) return Response.json([]);
    return Response.json(await searchArticles(q));
  } catch {
    // WP tak terjangkau: kembalikan kosong agar panel pencarian tetap hidup.
    return Response.json([]);
  }
}
