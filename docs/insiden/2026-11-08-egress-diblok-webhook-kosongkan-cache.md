# 8–12 Nov 2026: egress Railway diblok lagi, lalu webhook mengosongkan cache dan situs 500

Status: **Berjalan**. WordPress tak terjangkau dari Railway sejak 8 Nov ±13.00 WIB; seluruh halaman 500 sejak 11 Nov 21.17 WIB. Perbaikan kode di PR `claude/t-0076-webhook-swr` (draft, belum boleh di-deploy).
Tingkat: P1 / SEV-1 (beranda dan rubrik 500 untuk semua pembaca).
Pelapor: Farrez, tangkapan layar "Terjadi kesalahan" di /category/geopolitik, 12 Nov.

## Ringkasan

Kali ketiga sesudah 23 dan 29 Okt: firewall host webiihost men-DROP koneksi
dari IP statis Railway (208.77.246.240–242) ke `cms.theglobal-review.com`
(172.236.131.177). Dari laptop WordPress tetap menjawab 200 dalam <1 dtk.

Tiga hari pertama pembaca hampir tidak merasakannya karena halaman tersaji
dari cache. Lalu 11 Nov 14.17 UTC (21.17 WIB) WordPress mengirim webhook
(ada tulisan disimpan). `/api/revalidate` memanggil
`revalidateTag(tag, { expire: 0 })` untuk `wp:posts`, yang membuang cache
seketika. Setiap halaman yang memuat daftar tulisan (beranda, semua rubrik)
harus mengambil ulang dari WordPress, gagal, dan menjawab 500.

## Bukti

| Cek | Hasil |
|---|---|
| `curl` ber-UA browser ke www, 12 Nov 10.4x WIB | `/`, `/category/geopolitik`, `/category/analisis`: 500 |
| `railway logs`, galat aplikasi | `fetch failed [UND_ERR_CONNECT_TIMEOUT]` dan "pemutus terbuka (5180 galat transport beruntun)" |
| `railway logs --filter UND_ERR_CONNECT_TIMEOUT` per jam | sporadis 6–7 Nov, terus-menerus 50–120/jam sejak 8 Nov 06 UTC |
| `railway logs --network --since 30m` | 17 flow egress ke 172.236.131.177 (74/148/222/296 B, SYN diulang), 0 flow ingress darinya |
| Laptop ke `cms.*` (satu permintaan) | 200, 0,75 dtk |
| `railway logs --http --filter @path:/api/revalidate --since 4d` | satu webhook, 11 Nov 14:17:52 UTC, 200 |
| `railway logs --http` path `/`, 11 Nov 13.30–15.00 UTC | 200 sampai 14:1x, 500 sejak 14:1x (setelah webhook), 500 terus sampai kini dalam ±20 ms |

## Sebab

- **Langsung (blokir):** firewall host men-DROP IP egress Railway. Pemicu
  dan IP mana yang diblok hanya bisa dipastikan dari log lfd host.
- **Langsung (500):** `{ expire: 0 }` di webhook. Menurut docs
  `revalidateTag` Next 16, `expire: 0` berarti "stale content is never
  served"; profil `"max"` menyajikan salinan lama selagi revalidasi berjalan,
  dan bila revalidasi gagal salinan lama tetap dipakai.
- **Yang memperpanjang:** whitelist yang diminta sejak 23 Okt belum
  terkonfirmasi; tidak ada peringatan otomatis yang sampai ke manusia selama
  empat hari blokir.

## Yang diubah di kode kita

`src/app/api/revalidate/route.ts`: `profilUntuk()` memilih `"max"` untuk
semua tag, kecuali tag detail `wp:post:{slug}` bila tulisannya ditarik
(`status_new` bukan `publish`), yang tetap `{ expire: 0 }` supaya tulisan
yang dihapus tidak tersaji lagi. Tes regresinya merah bila `expire: 0`
dikembalikan.

Akibat sampingan yang disengaja: sesudah redaksi menerbitkan, pembaca
pertama di sebuah halaman daftar masih melihat versi lama, pembaca
berikutnya versi baru. Tulisan baru sendiri tidak terpengaruh karena
halamannya belum punya cache.

## Penanganan

1. Minta webiihost membuka blokir **dan** menaruh 208.77.246.240, .241,
   .242 di `csf.allow` (port 443) + `csf.ignore`, beserta alasan blokirnya.
2. **Jangan merge/deploy PR ini sebelum WordPress terjangkau lagi.** Halaman
   detail yang masih tersaji dari cache ikut hilang bila container diganti.
3. Setelah terbuka: `railway logs --network --since 10m --json` memuat flow
   ingress dari 172.236.131.177, `/` menjawab 200; lalu PR di-merge.

## Pelajaran

- Webhook revalidasi tidak boleh menjadi jalan untuk membuang satu-satunya
  salinan isi. Bawaannya stale-while-revalidate; pembuangan seketika hanya
  untuk konten yang memang harus hilang.
- Blokir egress yang sudah terjadi tiga kali butuh jalur yang tidak
  bergantung pada balasan webiihost (lihat tindak lanjut di laporan sesi).
