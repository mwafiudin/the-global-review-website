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
| **Performa** | PageSpeed Insights API (memuat data lapangan CrUX + skor lab sekaligus) |
| **Biaya** | **Nol.** Tidak ada langganan, tidak ada kuota berbayar |
| **Skrip pelacak di situs** | **Tidak ada** |
| **Status** | Rancangan; tidak ada kode yang disentuh |

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

### PageSpeed Insights API — sisi performa

Satu panggilan mengembalikan **dua jenis data sekaligus**, dan itu alasan
memilihnya ketimbang memanggil CrUX API terpisah:

| Jenis | Isi | Ketersediaan |
|---|---|---|
| **Data lapangan (CrUX)** | LCP, INP, CLS, FCP, TTFB dari pengguna Chrome sungguhan, 28 hari terakhir | Hanya bila trafik cukup |
| **Data lab (Lighthouse)** | Skor Performance, Accessibility, Best Practices, SEO | **Selalu ada**, tanpa syarat trafik |

Kombinasi ini penting: data lapangan lebih jujur tapi bisa kosong; data lab
selalu tersedia sehingga halaman tidak pernah benar-benar hampa.

Gratis dengan kunci Google Cloud. Tanpa kunci pun bisa, tapi kuota anonimnya
dibagi seluruh dunia dan **terbukti habis** saat dicoba menyusun dokumen ini
— jadi kunci wajib.

## 5. Kondisi terukur, 3 September 2026

Diukur lewat pagespeed.web.dev pada `https://theglobal-review.com/`, mobile.

**Data lapangan (CrUX, 28 hari terakhir):**

| Metrik | Nilai | Status |
|---|---|---|
| Core Web Vitals Assessment | **Not Applicable** | LCP & INP belum cukup sampel |
| LCP | N/A | — |
| INP | N/A | — |
| CLS | **0,05** | Baik |
| FCP | 2,6 dtk | Perlu perbaikan |
| TTFB | **1,8 dtk** | Buruk — lihat catatan di bawah |

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

**Origin TGR sudah masuk dataset CrUX** ("Many samples"). Ini menjawab satu-
satunya keraguan yang tersisa: API-nya akan mengembalikan data, rancangan
ini bisa jalan.

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
| **1. Kredensial** | Verifikasi properti GSC; buat service account dan tambahkan sebagai pengguna properti; kunci Google Cloud untuk PSI. Simpan sebagai konstanta di `wp-config.php` | ±1 jam | Tidak pernah masuk repo |
| **2. Klien API** | Dua klien HTTP di mu-plugin: GSC (OAuth service account, perlu JWT) dan PSI (kunci sederhana) | ±4 jam | GSC yang lebih rumit karena butuh penandatanganan JWT |
| **3. Cron + cache** | Ambil sekali sehari, simpan hasilnya sebagai opsi WordPress | ±2 jam | **Wajib.** PSI menjalankan Lighthouse langsung — 10–30 detik per panggilan, mustahil dipanggil saat halaman dimuat |
| **4. Halaman wp-admin** | Menu, tata letak, format angka, penanda tren | ±1 hari | Bagian terbesar |
| **5. Kondisi galat** | API mati, kredensial kedaluwarsa, data lapangan kosong | ±2 jam | Halaman harus berkata **"data tidak tersedia"**, bukan menampilkan nol — nol terbaca sebagai "tidak ada pembaca" |

Total kasar: **2–3 hari kerja.**

Tidak ada tahap "pasang pengukuran" seperti rancangan sebelumnya, dan itu
keuntungan besar: karena kedua sumber membaca data yang sudah dikumpulkan
Google, **riwayatnya sudah ada sejak sekarang**. Tidak ada urgensi memasang
sesuatu hari ini supaya datanya tidak hilang.

## 9. Riwayat jangka panjang

GSC menyimpan ±16 bulan, jadi sisi traffic tidak perlu diarsipkan sendiri —
berbeda dari rancangan sebelumnya yang berbasis Vercel dengan jendela 1
bulan.

Sisi performa lebih pendek: data lapangan CrUX hanya 28 hari bergulir, dan
skor Lighthouse bersifat sesaat. Bila tren performa ingin dilacak
berbulan-bulan, hasil harian dari cron tahap 3 tinggal disimpan menumpuk,
bukan ditimpa — biayanya nyaris nol bila diputuskan sejak awal. CrUX juga
menyediakan endpoint riwayat mingguan; cakupannya perlu dikonfirmasi saat
implementasi.

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
