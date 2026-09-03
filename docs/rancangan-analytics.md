# Rancangan Halaman Analytics — Traffic & Performa

Dokumen rancangan, **belum dieksekusi**. Disusun 3 September 2026; direvisi
hari yang sama setelah pengukuran nyata membatalkan sebagian asumsi awal.
Angka kuota dikutip dari dokumentasi resmi penyedia, dan angka performa
dari pengukuran langsung — bukan dari ingatan.

---

## 1. Keputusan

| | |
|---|---|
| **Pembaca halaman** | Redaksi — penulis dan editor yang ingin tahu tulisan mana yang dibaca |
| **Rumahnya** | wp-admin, sebagai menu tersendiri |
| **Traffic** | Google Search Console API |
| **Performa** | Chrome UX Report API (Core Web Vitals pengguna Chrome sungguhan) |
| **Biaya** | **Nol.** Tidak ada langganan, tidak ada kuota berbayar |
| **Skrip pelacak di situs** | **Tidak ada** |
| **Status** | **Selesai seluruhnya** (3 September 2026), lalu diperluas: grafik, filter rentang, pembandingan periode, riwayat performa |

Dua hal yang membuat rancangan ini tidak berbiaya sekaligus tidak berisiko
jebol kuota: keduanya membaca data yang **sudah dikumpulkan pihak lain**.
Google mengumpulkan data pencarian dari mesin pencarinya sendiri; Chrome
mengumpulkan data performa dari penggunanya. Situs TGR tidak perlu
menembakkan satu event pun.

Konsekuensi sampingannya bagus: situs tetap bersih tanpa pelacak, dan
**tidak perlu banner persetujuan cookie**.

## 2. Kenapa BUKAN plugin analytics WordPress

Perlu dinyatakan tegas karena tampak seperti jalan termudah, padahal buntu.

Seluruh akses WordPress di repo ini `server-only` — tidak ada satu pun
komponen client yang memanggilnya (diverifikasi dengan penyisiran `src/`).
Pembaca mengambil HTML ter-cache dari Vercel; WordPress hanya dilihat oleh
server Vercel saat revalidasi, beberapa kali per lima menit.

Maka **Jetpack Stats, Site Kit, Matomo-for-WP, dan sejenisnya akan buta**.
Mereka menghitung fetch server, bukan manusia. Angkanya tampak nyata, punya
grafik, dan sepenuhnya menyesatkan — lebih berbahaya daripada tidak punya
angka, karena keputusan redaksi akan diambil di atasnya.

wp-admin dipakai sebagai **tempat menampilkan**, bukan sebagai pengumpul.

## 3. Dua opsi yang ditolak, beserta alasannya

Dicatat supaya tidak diusulkan ulang enam bulan lagi.

### Vercel Web Analytics — ditolak

Punya API baca yang bagus, tapi paket Hobby membatasi **50.000 event/bulan**
dan **jendela pelaporan hanya 1 bulan**. Yang kedua berarti perbandingan
tahun-ke-tahun mustahil. Yang pertama berarti pengumpulan **berhenti** di
tengah bulan bila terlampaui — datanya bolong, bukan melambat.

Catatan penting yang sempat disalahpahami: **frekuensi membaca API tidak
memengaruhi kuota sama sekali.** Event dihabiskan saat pengunjung memuat
halaman, bukan saat data diambil. Membaca sekali sehari dan seribu kali
sehari menghabiskan jumlah yang persis sama: nol. Tuas penghematan yang
sesungguhnya adalah `sampleRate` — mengurangi persentase pengunjung yang
diukur.

### Vercel Speed Insights — ditolak

Tier gratisnya jauh lebih sempit dari dugaan:

| Aspek | Speed Insights gratis |
|---|---|
| Metrik | **Real Experience Score saja.** LCP, INP, CLS, TTFB butuh Plus ($10/proyek/bulan, khusus Pro) |
| Rentang tanggal | 24 jam dan 7 hari saja |
| Kuota | 10.000 event/30 hari; terlampaui → ingestion berhenti 14 hari |
| API baca | **Tidak ada yang terdokumentasi** |

Baris terakhir yang mematikan: tanpa API baca, datanya tidak bisa ditarik ke
wp-admin sama sekali. Ia hanya hidup di dasbor Vercel.

## 4. Sumber yang dipakai

### Google Search Console API — sisi traffic

| Aspek | Nilai |
|---|---|
| Biaya | Gratis, tanpa batas event |
| Retensi | ±16 bulan |
| Kuota API | 1.200 kueri/menit per situs — jauh di atas kebutuhan |
| Isi | Kueri pencarian, impresi, klik, CTR, posisi rata-rata |

**Batas yang harus diterima secara sadar: GSC hanya melihat Google Search.**
Ia tidak melihat pengunjung langsung, dari Facebook, atau dari WhatsApp —
padahal TGR punya halaman Facebook dan tombol berbagi WhatsApp, dan di
Indonesia jalur itu besar.

Artinya angkanya **konsisten lebih rendah dari trafik sebenarnya**. Ini
bukan cacat selama dilabeli jujur: di halaman nanti ia harus tertulis
**"Klik dari pencarian Google"**, bukan "Total pembaca". Salah label di sini
membuat redaksi menyimpulkan pertumbuhan yang keliru.

### Chrome UX Report API — sisi performa

LCP, INP, CLS, FCP, dan TTFB dari pengguna Chrome sungguhan, 28 hari
bergulir. Gratis dengan kunci Google Cloud. Panggilannya sekadar membaca
data yang sudah ada — biasanya di bawah satu detik.

**PageSpeed Insights sempat dipilih lebih dulu dan gagal di produksi.**
Alasan memilihnya masuk akal di atas kertas: satu panggilan memberi data
lapangan DAN skor Lighthouse, sehingga halaman tak pernah hampa saat data
lapangan tipis. Kenyataannya PSI menjalankan Lighthouse **secara langsung**
tiap dipanggil (10–40 detik), dan `max_execution_time` hosting ini
membunuh PHP sebelum ia menjawab — halaman terpotong tanpa pesan galat.

Yang hilang dengan berpindah ke CrUX hanya **skor Lighthouse**, yaitu hasil
simulasi lab. Data lapangannya identik: CrUX justru sumber yang dibaca PSI
untuk bagian itu, dan itulah yang dipakai Google untuk peringkat.

Bila skor Lighthouse suatu saat diinginkan, ia bisa ditambahkan lewat
**cron cPanel sungguhan** — PHP CLI di sana umumnya tanpa batas waktu.

## 5. Kondisi terukur, 3 September 2026

Diukur lewat pagespeed.web.dev pada `https://theglobal-review.com/`, mobile.

**Data lapangan (CrUX) — tingkat URL vs tingkat origin.** Perbedaan ini
penting dan sempat menyesatkan:

| Metrik | Beranda saja (pagespeed.web.dev) | **Seluruh origin** (API, periode berakhir 1 Sep) |
|---|---|---|
| LCP | N/A | **2.736 ms** — perlu perbaikan |
| INP | N/A | **132 ms** — baik |
| CLS | 0,05 — baik | 0,05 — baik |
| FCP | 2,6 dtk | 2.322 ms — perlu perbaikan |
| TTFB | 1,8 dtk | 1.439 ms — perlu perbaikan |

Tingkat URL menuntut tiap halaman memenuhi ambang sampelnya sendiri,
sehingga beranda saja belum cukup untuk LCP dan INP. Tingkat origin
menghimpun seluruh halaman dan **lengkap kelima metriknya**. Karena itu
klien di `tgr-statistik.php` menanyakan origin, bukan URL.

**Data lab (Lighthouse, mobile):**

| | Skor |
|---|---|
| Performance | 83 |
| Accessibility | 95 |
| Best Practices | 96 |
| **SEO** | **100** |
| LCP (lab) | 4,1 dtk |
| CLS (lab) | 0 |
| Total Blocking Time | 80 ms |

Tiga bacaan penting dari angka ini:

**Temuan pertama dari halaman yang sudah jalan (28 hari sampai 31 Agustus):**
795 klik dari 75.018 impresi, CTR 1,1%, posisi rata-rata 8,5. Tabel peluang
judul menemukan lima kueri berimpresi tinggi dengan CTR di bawah 0,25% —
`api naga digital` (8.289), tiga kueri seputar "IQ monyet/simpanse" (3.289
gabungan), dan `anwar tjokroaminoto` (505). Totalnya **±12.100 impresi, 16%
dari seluruh kemunculan TGR di Google, nyaris tanpa klik.** Posisinya sudah
5–8, jadi pekerjaannya menyunting judul, bukan menulis ulang.

**Satu-satunya metrik performa yang gagal adalah LCP.** INP dan CLS sudah "baik";
LCP 2.736 ms melewati ambang 2.500 ms. Karena penilaian Core Web Vitals
menuntut ketiganya lulus, **LCP sendirian yang menahan nilai keseluruhan**
— dan itu berarti ada satu sasaran perbaikan yang jelas, bukan pekerjaan
menyeluruh yang kabur.

**TTFB 1,8 detik janggal untuk situs statis di Vercel** — mestinya di bawah
0,5 detik. Penjelasan paling masuk akal: jendela CrUX 28 hari masih memuat
**situs WordPress lama**, karena peralihan domain baru 24 Agustus. FCP 2,6
detik kemungkinan sebab yang sama. Keduanya diperkirakan membaik sendiri
sekitar **21 September**, saat jendela 28 hari sepenuhnya berisi data
Vercel. Jangan mengambil kesimpulan performa sebelum tanggal itu.

**LCP lab 4,1 detik adalah titik lemah nyata** dan tidak terjelaskan oleh
peralihan domain — ini kondisi situs sekarang, di jaringan mobile
tertahan. Layak ditelusuri terpisah dari pekerjaan analytics ini.

## 6. Metrik yang layak ditampilkan

Disaring dengan satu ujian: **apakah angka ini mengubah keputusan redaksi?**
Metrik yang hanya enak dipandang tidak masuk.

| Metrik | Sumber | Kenapa layak |
|---|---|---|
| **Klik dari pencarian, 28 hari** | GSC | Angka utama. Dilabeli jujur sebagai klik pencarian, bukan total pembaca |
| **Halaman paling banyak diklik** | GSC, `dimensions=page` | Inti kebutuhan redaksi: tulisan mana yang benar-benar dibuka |
| **Kueri pencarian teratas** | GSC, `dimensions=query` | Bahasa yang dipakai pembaca — bahan judul dan sudut tulisan berikutnya |
| **Impresi tinggi, CTR rendah** | GSC | **Paling actionable.** TGR sudah muncul di hasil pencarian tapi judulnya tidak diklik. Perbaikan judul, bukan tulisan baru |
| **Posisi rata-rata & trennya** | GSC | Menunjukkan arah: naik atau turun di hasil pencarian |
| **Core Web Vitals** | PSI/CrUX | Status ringkas, bukan grafik. Ketiganya faktor peringkat |
| **Skor Lighthouse** | PSI lab | Selalu tersedia; jaring pengaman saat data lapangan kosong |

**Sengaja TIDAK ditampilkan:** bounce rate dan durasi sesi (tidak tersedia
dari sumber mana pun di sini, dan notorious menyesatkan untuk situs
artikel), serta angka real-time (mendorong perilaku obsesif tanpa mengubah
keputusan apa pun).

## 7. Sketsa tata letak

Satu halaman di bawah menu **Statistik** di wp-admin.

```
┌──────────────────────────────────────────────────────────────┐
│  Statistik                        [ 7 hari | 28 hari ]       │
│  Sumber: Google Search Console · diperbarui 06:00 tiap hari  │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │ Klik dari   │ │ Impresi     │ │ CTR         │ │ Posisi  │ │
│  │ pencarian   │ │             │ │             │ │ rata²   │ │
│  │   3.240     │ │  128.900    │ │   2,5%      │ │  18,4   │ │
│  │   ▲ 12%     │ │   ▲ 8%      │ │   ▼ 0,3pp   │ │  ▲ 1,2  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
├───────────────────────────────┬──────────────────────────────┤
│  TULISAN PALING BANYAK DIKLIK │  KUERI PENCARIAN TERATAS     │
│  1. Ekonomi Politik NU…   412 │  1. geopolitik indonesia     │
│  2. Media Takut Penguasa  388 │     1.2k impresi · 4,1% CTR  │
│  3. Menelisik Sindikat…   301 │  2. perang asimetris         │
│  …                            │  …                           │
├───────────────────────────────┴──────────────────────────────┤
│  PERLU PERBAIKAN JUDUL                                       │
│  Kueri berimpresi tinggi dengan CTR di bawah 2% — TGR sudah  │
│  muncul di hasil pencarian, judulnya yang tidak menarik klik │
│  • "politik luar negeri indonesia"   4.2k impresi · 0,8%     │
├──────────────────────────────────────────────────────────────┤
│  PERFORMA           Data lapangan Chrome, 28 hari terakhir   │
│  LCP  ●  N/A     INP  ●  N/A     CLS  ●  0,05  Baik          │
│  Lighthouse: Performa 83 · Aksesibilitas 95 · SEO 100        │
└──────────────────────────────────────────────────────────────┘
```

Prinsipnya: **angka besar di atas, daftar yang bisa ditindaklanjuti di
bawah.** Redaksi yang membuka sepuluh detik langsung tahu keadaan; yang
membuka lima menit menemukan bahan keputusan.

## 8. Tahapan kerja dan perkiraan

| Tahap | Isi | Perkiraan | Catatan |
|---|---|---|---|
| ~~**1. Kredensial**~~ | **SELESAI.** Properti terverifikasi lewat berkas HTML di `public/` (URL prefix `https://theglobal-review.com/` — situs Vercel, bukan WordPress). Service account + kunci PSI dibuat; JSON di `/home/theglob/secret/`, di luar `public_html` dan sudah diuji tak terjangkau dari luar | — | Konstanta di `wp-config.php`, tidak pernah masuk repo |
| ~~**2. Klien API**~~ | **SELESAI.** `wordpress/mu-plugins/tgr-statistik.php` v1.0.0 — klien GSC (JWT RS256 via `openssl_sign`, token di-cache 55 menit) dan PSI, plus layar Perkakas → Uji Statistik. Terpasang di produksi, uji berhasil | — | Berkas terpisah dari `tgr-headless.php` agar bisa dicabut sendiri |
| ~~**3. Cron + cache**~~ | **SELESAI.** Empat kueri GSC + satu CrUX, disimpan sebagai opsi non-autoload, disegarkan cron harian | — | **Catatan koreksi:** rancangan awal menyebut cron sebagai jalan keluar dari batas waktu PSI — itu keliru, WP-Cron berjalan lewat permintaan loopback dengan batas PHP yang sama. Yang menyelesaikannya adalah berpindah ke CrUX |
| ~~**4. Halaman wp-admin**~~ | **SELESAI.** Menu Statistik (kapabilitas `edit_posts`): empat kartu bertren, halaman terpopuler, kueri teratas, peluang perbaikan judul, lima Core Web Vitals berlencana | — | Angka diformat gaya Indonesia secara eksplisit; `number_format_i18n()` mengembalikan konvensi Inggris di pemasangan ini |
| ~~**5. Kondisi galat**~~ | **SELESAI.** Kegagalan per bagian tidak menggugurkan bagian lain; data lama dipertahankan bila seluruh pengambilan gagal; metrik tanpa sampel tampil "belum cukup data" bukan nol; data lebih tua dari 3 hari memicu peringatan di seluruh wp-admin dan penanda merah di halamannya | — | WP-Cron hanya menyala saat ada permintaan masuk, sedangkan instalasi ini headless — lihat catatan di bawah |

**Catatan penting soal penjadwal.** WP-Cron bukan cron sistem operasi: ia
hanya menyala ketika ada permintaan masuk ke WordPress. Instalasi ini
headless dan nyaris tak pernah dikunjungi manusia — satu-satunya lalu
lintas rutinnya adalah revalidasi dari Vercel tiap beberapa menit, dan
itulah yang selama ini menyalakannya.

Ketergantungan itu tidak kentara dan tidak bersuara bila putus: halaman
Statistik akan terus memajang angka lama seolah segar. Karena itu tahap 5
tidak berhenti pada penanganan galat, melainkan menambahkan peringatan
saat data lewat tiga hari. Bila peringatan itu suatu saat sering muncul,
jalan keluarnya cron cPanel sungguhan yang memanggil `wp-cron.php` — tidak
bergantung pada kunjungan sama sekali.

Tidak ada tahap "pasang pengukuran" seperti rancangan sebelumnya, dan itu
keuntungan besar: karena kedua sumber membaca data yang sudah dikumpulkan
Google, **riwayatnya sudah ada sejak sekarang**. Tidak ada urgensi memasang
sesuatu hari ini supaya datanya tidak hilang.

## 9. Riwayat jangka panjang — tidak perlu diarsipkan

Dikonfirmasi saat implementasi, dan hasilnya membatalkan rencana arsip
bulanan yang sempat dirancang:

| Sumber | Riwayat | Cara |
|---|---|---|
| Search Console | **16 bulan** | Kueri rentang tanggal apa pun, sesuai permintaan |
| CrUX History API | **40 minggu** (±10 bulan), titik mingguan | `records:queryHistoryRecord`, kunci dan kuota sama |

Google sudah menyimpan keduanya, jadi menabung snapshot sendiri hanya akan
menduplikasi data yang bisa diminta kapan saja. Filter tanggal cukup
mengubah parameter kueri.

**Deret harian diambil sekali untuk 365 hari**, lalu seluruh total, tren,
grafik, dan pembandingan periode diturunkan darinya di PHP. Tanpa itu, tiap
tombol rentang dan tiap pembandingan berarti panggilan API sendiri — dan
halaman berfilter akan memanggil Google setiap kali seseorang menekan
tombol.

## 10. Perluasan (3 September 2026)

**Grafik SVG digambar di PHP**, tanpa pustaka dan tanpa JavaScript.
Halaman ini diunggah manual lewat File Manager tanpa proses build, dan
skrip CDN di wp-admin berarti halaman rusak setiap kali CDN tak
terjangkau. Tooltip dicukupi elemen `<title>` bawaan SVG yang dirender
peramban sebagai tooltip asli. Garis diputus pada nilai kosong, bukan
disambung — minggu tanpa sampel bukan nol, dan menyambungnya mengarang
data.

**Filter rentang** 7 / 28 / 90 hari / 12 bulan, dengan pembandingan
terhadap periode sebelumnya atau tahun lalu. Keduanya nol panggilan API
karena diturunkan dari deret harian.

**Jadwal pengambilan Senin, Kamis, Sabtu.** Pola hari tetap, bukan interval
bergulir: interval mengambang begitu satu jalannya terlewat. WP-Cron
menjadwalkan dengan interval dan bukan hari, jadi acaranya didaftarkan
harian lalu disaring — satu tik yang pulang awal jauh lebih murah dirawat
daripada tiga jadwal mingguan yang harus dijaga selaras.

Konsekuensinya angka terlama bisa ±6 hari di belakang kenyataan (3 hari
jeda GSC + 3 hari jarak terjauh antar pengambilan), dan **ambang peringatan
data basi dinaikkan dari 3 ke 7 hari** — pada 3 hari ia akan menyala terus
tanpa ada yang rusak, dan alarm yang selalu berbunyi sama saja dengan tidak
ada.

## 10. Risiko dan yang belum pasti

- **LCP dan INP masih N/A.** Bagian performa akan tampil separuh kosong
  sampai sampelnya cukup. Halaman harus menanganinya dengan anggun.
- **Angka CrUX sekarang tercemar situs lama.** Jangan menarik kesimpulan
  performa sebelum ±21 September.
- **GSC buta terhadap Facebook, WhatsApp, dan kunjungan langsung.** Sudah
  diterima sebagai konsekuensi; mitigasinya label yang jujur (§4).
- **Kredensial di `wp-config.php`.** Kunci service account GSC memberi akses
  baca data properti. Harus di luar repo dan dibatasi ke satu properti.
- **Kuota PSI berkunci** perlu dicek saat implementasi; pemanggilan
  sekali sehari lewat cron jauh di bawah batas mana pun.

## 11. Sumber

- [Google — Search Console API limits](https://developers.google.com/webmaster-tools/limits)
- [Chrome — CrUX API](https://developer.chrome.com/docs/crux/api)
- [Vercel — Limits and Pricing for Speed Insights](https://vercel.com/docs/speed-insights/limits-and-pricing)
- [Vercel — Pricing for Web Analytics](https://vercel.com/docs/analytics/limits-and-pricing)
- Pengukuran langsung pagespeed.web.dev, 3 September 2026, 11:54 WIB
