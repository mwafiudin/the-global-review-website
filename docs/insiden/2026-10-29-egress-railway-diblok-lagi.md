# 29 Okt 2026: pembaca menggantung sampai 5 menit (egress Railway diblok lagi)

Status: **Berjalan** sejak 29 Okt ±23.31 WIB; WordPress tidak terjangkau dari Railway. Mitigasi kode di PR `claude/tgr-halaman-menggantung`.
Tingkat: P2 / SEV-2 (halaman yang belum di cache gagal; yang sudah di cache tetap tampil).
Pelapor: pemeriksa sintetis (issue #38) dan sampling log HTTP untuk laporan infrastruktur T-0076, 30 Okt.

## Ringkasan

Tiga menit setelah deploy `7ef1a89` (PR #36, Next 16.4.3) container baru
tidak bisa membuka koneksi ke `cms.theglobal-review.com` (172.236.131.177).
Polanya sama dengan insiden 23 Okt: flow egress 74/148/222/296/370 byte
(SYN diulang) tanpa satu pun flow ingress, sementara dari laptop WordPress
menjawab 200 dalam ±1 dtk. Static Outbound IP masih aktif
(208.77.246.240–242, tipe Shared), jadi salah satu atau ketiganya kini
di-DROP firewall host. Whitelist yang diminta 23 Okt belum terkonfirmasi.

Yang membuat pembaca menunggu menit, bukan detik, adalah kode kita sendiri:
setiap fetch WP menunggu connect timeout undici 10 dtk, lalu **diulang**
(700 ms + 10 dtk lagi), sambil memegang satu dari empat slot semafor
`MAX_CONCURRENT`. Antrean slot tidak punya batas waktu. Satu halaman rubrik
butuh 4–6 panggilan WP, jadi dengan puluhan halaman dingin yang diminta
serentak (pembaca + crawler) antrean menumpuk sampai Railway memutus di
detik ke-300.

## Dampak (log HTTP 30 Okt 05.34–11.18 WIB, 5.000 baris)

| | Sehat (29 Okt 20.30–23.19 WIB) | Saat blokir |
|---|---|---|
| 200 | 94,2% | 27,6% (semuanya dari cache, p50 10 ms) |
| 499 (pembaca menyerah) | 0,1% | 47,3%, p50 28 dtk, p90 298 dtk |
| 500 | 0,0% | 2,1%, p50 89 dtk |
| 504 `/_next/image` | 0 | 1,2% (optimizer gagal mengambil gambar dari `cms.*`, 7 dtk) |
| 404 `/podcast/*`, `/bedah-buku/*` | 2 | 191 (palsu: daftar gagal dibaca dianggap kosong) |

Galat aplikasi: ±350–650 `UND_ERR_CONNECT_TIMEOUT` dan ±300–450 "WP tidak
menjawab dalam batas waktu" per jam sejak 29 Okt 23.31 WIB.

## Kronologi (WIB)

| Waktu | Kejadian |
|---|---|
| 29 Okt 20.44 | Pemeriksa sintetis terakhir lulus. |
| 29 Okt 23.28 | Deploy `7ef1a89` (PR #36). Container lama berhenti 23.30. |
| 29 Okt 23.31 | Galat pertama "WP tidak menjawab dalam batas waktu". |
| 30 Okt 02.17 | Pemeriksa sintetis gagal pertama kali (jadwal 15 menit, GitHub menjalankannya tiap 3–6 jam). |
| 30 Okt 09.53 | Issue #38 "Situs tidak menampilkan tulisan terbaru". |
| 30 Okt 11.19 | Diagnosis: 576 flow egress ke 172.236.131.177 dalam 12 menit, nol flow ingress; dari laptop 200 dalam ±1 dtk. |

## Sebab

- **Langsung:** firewall host webiihost men-DROP IP egress Railway.
  Yang mana dari tiga IP statis, dan kenapa, hanya bisa dipastikan dari
  log lfd host (`csf -g 208.77.246.240` dst.).
- **Kandidat pemicu:** (1) deploy memindahkan container ke jalur egress
  lain dari tiga IP HA, dan IP itu sudah lebih dulu diblok (jarak tiga
  menit terlalu pendek untuk ambang rate lfd); (2) IP-nya Shared, dipakai
  pelanggan Railway lain, sehingga bisa masuk daftar blokir yang dipasang
  host; (3) badai cache dingin setelah deploy. Tidak satu pun terbukti tanpa
  log host.
- **Yang memperpanjang:** whitelist 23 Okt belum dikonfirmasi; fetch yang
  timeout tetap diulang; antrean semafor tanpa batas waktu; pemeriksa
  sintetis berjalan jauh lebih jarang dari jadwalnya.

## Penanganan

1. Minta webiihost membuka blokir **dan** menaruh 208.77.246.240, .241,
   .242 di `csf.allow` (port 443) + `csf.ignore`, beserta alasan blokirnya.
2. **Jangan merge/redeploy sebelum WP terjangkau lagi.** Cache ISR hidup
   di disk container; deploy baru mulai kosong, jadi halaman yang sekarang
   masih tersaji dari cache (27,6% request) ikut gagal.
3. Setelah terbuka: `railway logs --network --since 10m --json` harus
   memuat flow ingress dari 172.236.131.177; `node scripts/pantau-artikel-terbaru.mjs` keluar 0.

## Tindak lanjut

| Tindakan | Jenis | Status |
|---|---|---|
| Timeout tidak diulang; antrean slot WP berbatas 10 dtk; pemutus (4 galat transport beruntun, jeda 30 dtk, satu permintaan uji) | batasi dampak | PR `claude/tgr-halaman-menggantung` |
| Detail podcast, bedah buku, galeri tidak lagi 404 saat WP gagal dibaca | batasi dampak | PR yang sama |
| Whitelist tiga IP statis di webiihost, terkonfirmasi tertulis | cegah | menunggu webiihost |
| Cache yang selamat dari deploy (volume `.next/cache` atau cache handler bersama) | batasi dampak | usulan, perlu keputusan |
| Pemeriksa dari luar GitHub cron (mis. UptimeRobot) karena cron Actions tertunda berjam-jam | deteksi | usulan |

## Pelajaran

- Timeout per fetch tidak cukup: yang dirasakan pembaca adalah jumlah
  timeout, ulangan, dan waktu antre. Ketiganya perlu batas.
- Deploy saat sumber data tidak terjangkau membuang satu-satunya salinan
  isi yang masih bisa disajikan.
