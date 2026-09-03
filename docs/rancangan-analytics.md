# Rancangan Halaman Analytics — Traffic & Performa

Dokumen rancangan, **belum dieksekusi**. Disusun 3 September 2026 dari
pemeriksaan langsung kode dan dokumentasi penyedia; angka kuota di bawah
dikutip dari dokumentasi resmi, bukan ingatan.

---

## 1. Keputusan yang sudah diambil

| | |
|---|---|
| **Pembaca halaman** | Redaksi — penulis dan editor yang ingin tahu tulisan mana yang dibaca |
| **Rumahnya** | wp-admin, sebagai menu tersendiri |
| **Sumber data** | Vercel Web Analytics API + Google Search Console API |
| **Status** | Rancangan; tidak ada kode yang disentuh |

Rumahnya wp-admin karena redaksi sudah masuk ke sana tiap hari. Menaruhnya
di tempat lain berarti menuntut kebiasaan baru, dan dasbor yang tidak
pernah dibuka sama saja dengan tidak ada.

## 2. Kenapa BUKAN plugin analytics WordPress

Ini perlu dinyatakan tegas karena tampak seperti jalan termudah, padahal
buntu.

Seluruh akses WordPress di repo ini `server-only` — tidak ada satu pun
komponen client yang memanggilnya (diverifikasi dengan penyisiran
`src/`). Pembaca mengambil HTML ter-cache dari Vercel; WordPress hanya
dilihat oleh server Vercel saat revalidasi, beberapa kali per lima menit.

Maka **Jetpack Stats, Site Kit, Matomo-for-WP, dan sejenisnya akan buta**.
Mereka menghitung segelintir fetch server, bukan manusia. Angkanya tampak
nyata, punya grafik, dan sepenuhnya menyesatkan — lebih berbahaya daripada
tidak punya angka sama sekali, karena keputusan redaksi akan diambil di
atasnya.

Yang dipakai adalah wp-admin sebagai **tempat menampilkan**, dengan data
ditarik dari API pihak yang benar-benar melihat pembaca.

## 3. Sumber data dan batas nyatanya

### Vercel Web Analytics — paket Hobby

| Aspek | Nilai |
|---|---|
| Kuota | **50.000 event/bulan** (1 pageview = 1 event), lintas seluruh proyek dalam akun |
| Jendela pelaporan | **1 bulan** |
| Custom event | **Tidak tersedia** di Hobby |
| Parameter UTM | Tidak tersedia di Hobby |
| Bila kuota habis | Masa tenggang 3 hari, lalu **pengumpulan dihentikan**; jalan lagi setelah 7 hari atau setelah naik ke Pro |
| API baca | `api.vercel.com/v1/query/web-analytics/visits/{count,aggregate}`, Bearer token |

Dua batas ini membentuk seluruh rancangan:

**Jendela 1 bulan** berarti data lebih tua dari sebulan tidak dijamin bisa
dikueri lagi. Perbandingan kuartal atau tahun-ke-tahun **mustahil** dari
Vercel saja di paket Hobby. Konsekuensinya ada di §6.

**Kuota 50.000** perlu dihitung terhadap trafik nyata. Bila TGR menembusnya,
pengumpulan berhenti di tengah bulan dan angkanya bolong — bukan melambat,
tapi hilang. Trafik saat ini belum terukur (belum ada pelacak sama sekali),
jadi bulan pertama sekaligus jadi pengukur apakah Hobby memadai.

### Google Search Console

| Aspek | Nilai |
|---|---|
| Biaya | Gratis, tanpa batas event |
| Retensi | ±16 bulan — **jauh melampaui Vercel** |
| Kuota API | 1.200 kueri/menit per situs; jauh di atas kebutuhan halaman ini |
| Isi | Kueri pencarian, impresi, klik, CTR, posisi rata-rata |

GSC adalah sumber yang paling berharga untuk media seperti TGR. Vercel
menjawab *"berapa yang datang"*; GSC menjawab *"orang mencari apa lalu
menemukan kami"* — dan yang kedua itulah yang mengarahkan keputusan
redaksional.

### Vercel Speed Insights — sisi performa

Core Web Vitals (LCP, CLS, INP) dari pengunjung sungguhan, bukan lab.
Relevan karena ketiganya faktor peringkat pencarian. Paket Hobby juga
terbatas; perlu dicek terpisah di dasbor.

### Catatan privasi

Vercel Analytics **tanpa cookie**. Artinya tidak perlu banner persetujuan —
berbeda dengan Google Analytics 4, yang akan menuntut UI consent dan
menambah gesekan di halaman yang sekarang bersih. Ini alasan tersendiri
memilih Vercel ketimbang GA4, di luar soal akurasi.

## 4. Metrik yang layak ditampilkan

Disaring dengan satu ujian: **apakah angka ini mengubah keputusan
redaksi?** Metrik yang hanya enak dipandang tidak masuk.

| Metrik | Sumber | Kenapa layak |
|---|---|---|
| **Tulisan terpopuler 30 hari** | Vercel, `by=requestPath` | Inti kebutuhan redaksi: mana yang benar-benar dibaca. Menjawab "apakah rubrik ini layak dilanjutkan" |
| **Kueri pencarian teratas** | GSC | Menunjukkan bahasa yang dipakai pembaca — bahan judul dan sudut tulisan berikutnya |
| **Kueri berimpresi tinggi tapi CTR rendah** | GSC | Paling actionable: TGR sudah muncul di hasil pencarian tapi judulnya tidak diklik. Perbaikan judul, bukan tulisan baru |
| **Tren pageview harian** | Vercel, `by=day` | Konteks: lonjakan atau penurunan, dan apa penyebabnya |
| **Sumber rujukan** | Vercel, `by=referrerHostname` | Menunjukkan kanal mana yang benar-benar mengalirkan pembaca |
| **Sebaran negara** | Vercel, `by=country` | Relevan untuk media geopolitik — apakah dibaca dari luar Indonesia |
| **Core Web Vitals** | Speed Insights | Satu angka kesehatan teknis; ditampilkan sebagai status, bukan grafik |

**Sengaja TIDAK ditampilkan:** bounce rate dan durasi sesi (Vercel tidak
menyediakannya, dan keduanya notorious menyesatkan untuk situs artikel),
serta angka real-time (mendorong perilaku obsesif tanpa mengubah keputusan
apa pun).

## 5. Sketsa tata letak

Satu halaman di bawah menu **Statistik** di wp-admin.

```
┌──────────────────────────────────────────────────────────────┐
│  Statistik                        [ 7 hari | 30 hari ]       │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐  │
│  │ Pembaca    │ │ Pageview   │ │ Klik dari  │ │ Web       │  │
│  │  12.400    │ │  18.900    │ │ Pencarian  │ │ Vitals    │  │
│  │  ▲ 12%     │ │  ▲ 8%      │ │  3.200     │ │  Baik     │  │
│  └────────────┘ └────────────┘ └────────────┘ └───────────┘  │
├──────────────────────────────────────────────────────────────┤
│  Tren harian                                                 │
│  ▁▂▃▅▇▆▄▃▂▄▆█▇▅▃  (sparkline, bukan grafik penuh)            │
├───────────────────────────────┬──────────────────────────────┤
│  TULISAN TERPOPULER           │  KUERI PENCARIAN TERATAS     │
│  1. Ekonomi Politik NU…  2.1k │  1. geopolitik indonesia     │
│  2. Media Takut Penguasa 1.8k │     1.2k impresi · 4,1% CTR  │
│  3. Menelisik Sindikat…  1.4k │  2. perang asimetris         │
│  …                            │  …                           │
├───────────────────────────────┼──────────────────────────────┤
│  SUMBER RUJUKAN               │  PERLU PERBAIKAN JUDUL       │
│  google.com          64%      │  Kueri berimpresi tinggi,    │
│  facebook.com        18%      │  CTR di bawah 2% — judul     │
│  langsung            11%      │  tidak menarik klik          │
└───────────────────────────────┴──────────────────────────────┘
```

Prinsip tata letaknya: **angka besar di atas, daftar yang bisa
ditindaklanjuti di bawah.** Redaksi yang membuka sepuluh detik harus
langsung tahu keadaan; yang membuka lima menit menemukan bahan keputusan.

## 6. Masalah yang harus diputuskan: jendela 1 bulan

Ini konsekuensi terpenting dari paket Hobby, dan **tidak bisa ditunda tanpa
biaya**.

Data Vercel yang lewat sebulan tidak dijamin bisa dikueri lagi. Bila TGR
ingin suatu saat menjawab *"bagaimana pertumbuhan kami dibanding tahun
lalu"*, datanya harus **diarsipkan sendiri selagi masih ada**.

Tiga jalan:

| Jalan | Biaya | Konsekuensi |
|---|---|---|
| **Arsipkan bulanan sendiri** | Kecil — cron bulanan menyimpan rekap ke satu opsi/CPT di WordPress | Riwayat tumbuh sejak hari pertama. **Murah sekarang, mustahil nanti** |
| Naik ke Vercel Pro | $20/bulan/tim | Jendela 12 bulan, plus custom event dan UTM |
| Andalkan GSC saja untuk riwayat panjang | Nol | Cukup untuk tren pencarian, tapi tidak untuk pageview |

Rekomendasi: **arsipkan bulanan**, dipasang bersamaan dengan pengukurannya.
Menambahkannya setahun lagi berarti setahun riwayat yang hilang permanen.

## 7. Tahapan kerja dan perkiraan

| Tahap | Isi | Perkiraan | Catatan |
|---|---|---|---|
| **1. Pengukuran** | Pasang `@vercel/analytics` + `@vercel/speed-insights`; verifikasi properti GSC; kirim sitemap | ±2 jam | **Mendesak.** Data tidak bisa diambil surut — tiap hari tertunda adalah data yang hilang selamanya |
| **2. Kredensial** | Token Vercel; service account GSC ditambahkan sebagai pengguna properti; simpan sebagai konstanta di `wp-config.php` | ±1 jam | Tidak pernah masuk repo |
| **3. Halaman wp-admin** | Menu, klien HTTP ke dua API, cache transient (±1 jam), tampilan | 1–2 hari | Bagian terbesar. Cache wajib: tanpa itu tiap muat halaman memanggil API |
| **4. Arsip bulanan** | Cron menyimpan rekap sebelum jendela Vercel lewat | ±3 jam | Lihat §6 |
| **5. Kondisi galat** | API mati, kuota habis, kredensial kedaluwarsa | ±2 jam | Halaman harus mengatakan "data tidak tersedia", **bukan menampilkan nol** — nol terbaca sebagai "tidak ada pembaca" |

Tahap 1 layak dikerjakan lebih dulu dan terpisah, apa pun keputusan soal
halamannya: ia murah, dan menundanya membuang data yang tidak bisa
dipulihkan.

## 8. Risiko

- **Kuota Hobby 50.000 event/bulan belum teruji.** Trafik TGR belum pernah
  diukur. Bila terlampaui, pengumpulan berhenti dan datanya bolong. Bulan
  pertama menjawab ini.
- **Kredensial di `wp-config.php`.** Token Vercel dan kunci service account
  GSC memberi akses baca ke data analitik. Harus di luar repo, dan
  sebaiknya dibatasi ke satu proyek/properti.
- **Halaman ini menambah beban wp-admin.** Mitigasinya cache transient;
  tanpa itu, redaksi menunggu dua panggilan API tiap kali membuka menu.
- **Speed Insights di Hobby** punya batas tersendiri yang belum dicek —
  perlu dikonfirmasi di dasbor sebelum diandalkan.

## 9. Sumber

- [Vercel — Query Web Analytics with the API](https://vercel.com/docs/analytics/web-analytics-api)
- [Vercel — Pricing for Web Analytics](https://vercel.com/docs/analytics/limits-and-pricing)
- [Google — Search Console API limits](https://developers.google.com/webmaster-tools/limits)
