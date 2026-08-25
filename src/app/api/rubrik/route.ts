import type { NextRequest } from "next/server";
import { byCategoryWithTotal } from "@/lib/wp/articles";
import { wpUserIdFor } from "@/lib/wp/map";

/**
 * Proxy filter rubrik untuk CategoryBrowser (client) — pola yang sama
 * dengan /api/search. Sebelumnya filter/urut dijalankan di browser atas
 * SATU lembar 100 artikel terbaru: "Terlama" pada rubrik 900 artikel
 * mengembalikan yang tertua dari 100 terbaru, dan filter penulis/waktu
 * menjawab "tidak ada hasil" untuk artikel yang nyata-nyata ada di arsip.
 * Di sini filternya diteruskan ke kueri WordPress sehingga mencakup seluruh
 * rubrik; hasil per kombinasi di-cache (unstable_cache, tag wp:posts).
 *
 * "lembar" = jendela 100 artikel ke-n dari hasil TERFILTER (paginasi 8/hal
 * di browser berjalan di dalam jendela ini).
 */

/** Jalur rubrik FE: segmen slug dipisah garis miring, tanpa karakter liar. */
const PATH_RE = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/;

/** "YYYY-MM" bulan berjalan menurut jam Jakarta (bukan zona server/UTC). */
function bulanJakarta(): { tahun: string; bulan: string } {
  const [tahun, bulan] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .split("-");
  return { tahun, bulan };
}

/** Batas bawah `after` untuk filter waktu; WP menafsirkannya di zona situs (WIB). */
export function awalRentang(
  waktu: string,
  kini = bulanJakarta()
): string | undefined {
  if (waktu === "tahun") return `${kini.tahun}-01-01T00:00:00`;
  if (waktu === "bulan") return `${kini.tahun}-${kini.bulan}-01T00:00:00`;
  return undefined;
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const rubrik = p.get("rubrik") ?? "";
  const sub = p.get("sub") ?? "";
  const key = sub || rubrik;
  if (!PATH_RE.test(key)) {
    return Response.json({ error: "rubrik tidak valid" }, { status: 400 });
  }
  // Sub harus turunan rubriknya — endpoint ini bukan proxy kueri bebas.
  if (sub && rubrik && sub !== rubrik && !sub.startsWith(`${rubrik}/`)) {
    return Response.json({ error: "sub di luar rubrik" }, { status: 400 });
  }

  const lembar = Math.min(Math.max(1, Number(p.get("lembar")) || 1), 60);
  const extra: Record<string, string | number | undefined> = {};

  const penulis = p.get("penulis");
  if (penulis) {
    // Hanya slug penulis FE yang terpetakan ke user WP yang bisa dikueri;
    // selain itu hasilnya pasti kosong — jawab tanpa menyentuh WordPress.
    const id = await wpUserIdFor(penulis);
    if (id === null) return Response.json({ list: [], total: 0 });
    extra["author[]"] = id;
  }

  const awal = awalRentang(p.get("waktu") ?? "");
  if (awal) extra.after = awal;

  if (p.get("urut") === "lama") {
    extra.orderby = "date";
    extra.order = "asc";
  }

  try {
    const { list, total } = await byCategoryWithTotal(key, 100, lembar, extra);
    return Response.json({ list, total });
  } catch (err) {
    // Lembar di luar rentang (filter menyempit saat pembaca sudah jauh di
    // paginasi) dijawab WP dengan 400 — itu hasil kosong, bukan pemadaman.
    if (err instanceof Error && err.message.includes("400")) {
      return Response.json({ list: [], total: 0 });
    }
    return Response.json({ error: "WordPress tak terjangkau" }, { status: 502 });
  }
}
