# 23 Okt 2026: tulisan baru tidak tampil (egress Railway diblok firewall WP)

Status: **Terbuka**, menunggu webiihost membuka blokir.
Tingkat: P2 / SEV-2 (fungsi inti gagal untuk sebagian halaman; situs tetap menyajikan cache lama).
Pelapor: klien, lewat Wafi (WhatsApp, 23 Okt 09.30 WIB).

## Ringkasan

Sejak 23 Okt 08.45 WIB server frontend di Railway tidak bisa membuka koneksi
ke `cms.theglobal-review.com` (172.236.131.177). Halaman yang sudah ada di
cache (beranda, sebagian artikel) tetap tampil versi lama; halaman yang belum
di cache, termasuk tulisan baru 09.04 WIB, timeout. Webhook WP ke Railway tetap
200 karena arahnya masuk, bukan keluar, sehingga wp-admin melaporkan "sukses".

## Dampak

- Tulisan baru tidak muncul di beranda dan halamannya tidak bisa dibuka.
- Pencarian dan artikel lama yang belum di cache ikut timeout (499/500).
- ±1.200–2.000 galat WP per jam di log Railway sejak 08.45 WIB.

## Kronologi (WIB)

| Waktu | Kejadian |
|---|---|
| 22 Okt 17.41 | Redeploy Railway (commit sama `de172cd`, dipicu manual dari dashboard). Cache ISR kosong; IP egress bisa berganti. |
| 23 Okt 08.43 | Request artikel mulai 499 setelah 10 s (WP sudah lambat/terputus). |
| 23 Okt 08.45 | Galat pertama `Gagal menghubungi WordPress … fetch failed`. |
| 23 Okt 09.04 | Redaksi menerbitkan tulisan; webhook `/api/revalidate` 200. |
| 23 Okt 09.30 | Klien melapor lewat Wafi. |
| 23 Okt ±11.30 | Diagnosis: log network Railway hanya berisi SYN ke 172.236.131.177 tanpa balasan; dari dalam container IP egress `208.77.246.75`, fetch ke WP timeout; dari laptop WP 200 dalam 1,3 s. |

## Sebab

- **Langsung:** firewall host webiihost (pola CSF/lfd) men-DROP IP egress
  Railway `208.77.246.75`. Bukti: flow egress 74/148/222/296/370 byte =
  SYN diulang tanpa SYN-ACK; vantage lain menjangkau WP normal.
- **Pemicu:** belum diketahui; hanya log lfd di host yang bisa memastikan
  (`csf -g 208.77.246.75`). Kandidat: seluruh lalu lintas pembaca tiba di WP
  dari satu IP egress (lihat `docs/hosting-railway.md` §9 "Alamat IP pembaca"),
  sehingga ambang rate/ModSecurity lfd tercapai atas nama satu IP.
- **Yang memperpanjang:** tidak ada pemantau dari luar; galat `fetch failed`
  tidak mencatat kode sebabnya; IP egress Railway bukan static sehingga tidak
  pernah di-whitelist.

## Penanganan

1. Minta webiihost membuka blokir dan menaruh IP egress di `csf.allow`
   beserta alasan blokir (draf pesan di laporan insiden).
2. Setelah terbuka: `railway logs -f '"Gagal menghubungi"'` harus kosong,
   `node scripts/pantau-artikel-terbaru.mjs` keluar 0.
3. Jangan redeploy sebelum blokir dibuka: build mem-prerender dari WP dan
   akan gagal (§9).

## Tindak lanjut

| Tindakan | Jenis | Status |
|---|---|---|
| Kode sebab undici (`[UND_ERR_CONNECT_TIMEOUT]`, dll.) ikut di pesan galat WP | deteksi | selesai (`src/lib/wp/client.ts`) |
| Pemeriksa sintetis 15 menit: tulisan terbaru harus tampil, gagal membuka issue | deteksi | selesai (`.github/workflows/pantau-situs.yml`), aktif setelah push |
| IP egress tetap (Railway Static Outbound IP) + whitelist permanen di host | cegah | static IP aktif 23 Okt (208.77.246.240–242, ADR 0001); whitelist menunggu webiihost |
| Konfirmasi pemicu blokir dari log lfd | selidiki | menunggu webiihost |
| Pindah ke VPS sendiri (COD-42) menghapus ketergantungan firewall shared host | cegah | rencana berjalan |

## Pelajaran

- Webhook 200 bukan bukti situs sehat: arah masuk dan keluar bisa putus sendiri-sendiri.
- Cache yang menyembunyikan galat membuat situs tampak sehat; yang perlu diuji adalah hasil yang dilihat pembaca.
- `railway logs --network` membedakan blokir (SYN tanpa balasan) dari WP lambat dalam satu perintah.
