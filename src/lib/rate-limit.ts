/**
 * Rem per kunci (biasanya alamat IP) di memori proses: jendela bergulir,
 * paling banyak N kejadian per jendela. Dipakai rute tulis (contact,
 * subscribe) sebagai penahan agar satu peramban tidak mengulang kirim
 * beruntun — WordPress membatasi lagi di lapis kedua.
 *
 * Dua batas menjaga proses yang hidup berminggu-minggu (bukan lambda yang
 * didaur ulang) tetap ringan di bawah banjir permintaan:
 * - per kunci, jejak berhenti bertambah begitu batas terlampaui, jadi satu
 *   pengirim yang menembak ribuan kali per menit tidak membuat array (dan
 *   biaya tiap panggilan) membengkak;
 * - jumlah kunci dibatasi keras: kunci basi disapu dulu, dan bila masih
 *   penuh kunci tertua dibuang — banjir alamat unik tidak menumbuhkan peta
 *   tanpa batas.
 */
export function buatRem({
  jendelaMs,
  maksPerJendela,
  maksKunci = 1000,
}: {
  jendelaMs: number;
  maksPerJendela: number;
  maksKunci?: number;
}) {
  const jejak = new Map<string, number[]>();

  function beriRuang(sekarang: number): void {
    for (const [kunci, waktu] of jejak) {
      if (sekarang - waktu[waktu.length - 1] >= jendelaMs) jejak.delete(kunci);
    }
    // Map menjaga urutan penyisipan: entri pertama = kunci tertua.
    while (jejak.size >= maksKunci) {
      const tertua = jejak.keys().next().value;
      if (tertua === undefined) break;
      jejak.delete(tertua);
    }
  }

  return {
    terlaluSering(kunci: string, sekarang = Date.now()): boolean {
      if (jejak.size >= maksKunci && !jejak.has(kunci)) beriRuang(sekarang);
      const baru = (jejak.get(kunci) ?? []).filter((t) => sekarang - t < jendelaMs);
      if (baru.length >= maksPerJendela) {
        jejak.set(kunci, baru);
        return true;
      }
      baru.push(sekarang);
      jejak.set(kunci, baru);
      return false;
    },
    /** Jumlah kunci yang sedang dilacak — untuk tes dan pemantauan. */
    get ukuran(): number {
      return jejak.size;
    },
  };
}
