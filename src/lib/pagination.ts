/**
 * Paginasi arsip rubrik berbasis path: /category/{rubrik}/halaman/{n}.
 * Lewat path, bukan ?page= — searchParams memaksa rendering dinamis dan
 * mematikan ISR, padahal halaman arsip justru kandidat cache terbaik.
 */

export interface ParsedHalaman {
  /** Segmen rubrik tanpa ekor paginasi. */
  rubrik: string[];
  /** Nomor halaman, 1 bila tidak ada ekor /halaman/{n}. */
  page: number;
  /** true bila URL memuat ekor /halaman/{n} secara eksplisit. */
  explicit: boolean;
}

/**
 * Pisahkan ekor ["halaman", "<angka>"] dari segmen catch-all rubrik.
 * Hanya angka bulat polos ≥ 1 yang diakui ("2", bukan "02"/"2x"), sisanya
 * dibiarkan utuh sebagai slug rubrik agar jatuh ke 404 lewat gerbang yang
 * sudah ada.
 */
export function parseHalaman(segments: string[]): ParsedHalaman {
  const i = segments.length - 2;
  if (i >= 1 && segments[i] === "halaman") {
    const raw = segments[i + 1];
    const n = Number(raw);
    if (Number.isInteger(n) && n >= 1 && String(n) === raw) {
      return { rubrik: segments.slice(0, i), page: n, explicit: true };
    }
  }
  return { rubrik: segments, page: 1, explicit: false };
}

/** URL halaman ke-n sebuah rubrik; halaman 1 kembali ke URL kanonisnya. */
export function halamanHref(rubrikKey: string, page: number): string {
  const dasar = `/category/${rubrikKey}`;
  return page <= 1 ? dasar : `${dasar}/halaman/${page}`;
}

/**
 * Deret nomor yang ditampilkan nav: halaman pertama, terakhir, dan jendela
 * ±1 di sekitar halaman aktif; null menandai elipsis. Menjaga nav tetap
 * pendek untuk rubrik beratus halaman tanpa menyembunyikan ujung arsip.
 */
export function halamanWindow(
  current: number,
  totalPages: number
): (number | null)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const tampil = new Set<number>([1, totalPages]);
  for (let n = current - 1; n <= current + 1; n++) {
    if (n >= 1 && n <= totalPages) tampil.add(n);
  }
  const urut = [...tampil].sort((a, b) => a - b);
  const hasil: (number | null)[] = [];
  for (let i = 0; i < urut.length; i++) {
    if (i > 0 && urut[i] - urut[i - 1] > 1) hasil.push(null);
    hasil.push(urut[i]);
  }
  return hasil;
}
